const moment = require('moment/moment')
const core = require('@actions/core')

async function stopLongRunningWorkflows(
  app,
  scanRangeDays,
  stoppableStates,
  timeoutMinutes,
  reporter
) {
  // Initialize time ranges
  const now = Date.now()
  // We limit this range not to bring too many workflows
  const workflowsSearchRangeInDays = moment()
    .subtract(scanRangeDays, 'days')
    .format('YYYY-MM-DD')
  const githubHeaders = {
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }

  // Iterate through app installations(repositories) and then through workflows
  for await (const { installation } of app.eachInstallation.iterator()) {
    for await (const { octokit, repository } of app.eachRepository.iterator({
      installationId: installation.id
    })) {
      core.info(`Working on ${repository.full_name}`)
      // TODO: paginate
      const runs = await octokit.request(
        `GET /repos/${repository.full_name}/actions/runs`,
        {
          per_page: 100,
          created: `>${workflowsSearchRangeInDays}`,
          ...githubHeaders
        }
      )
      // The api doesn't allow to search for more than one state per call
      // So we retrieve all the workflows in the past X days and then we
      // post-filter on the "stoppable" states
      // TODO: fetch in parallel the "stoppable" states, for efficiency
      const stopCandidates = runs.data.workflow_runs
        .filter(workflowRuns => stoppableStates.includes(workflowRuns.status))
        .map(workflowRuns => {
          return {
            repository_fullname: repository.full_name,
            display_title: workflowRuns.display_title,
            run_number: workflowRuns.run_number,
            id: workflowRuns.id,
            elapsedTimeInSeconds: moment
              .duration(now - Date.parse(workflowRuns.run_started_at))
              .asSeconds()
          }
        })
        .filter(
          filteredRuns =>
            filteredRuns.elapsedTimeInSeconds > timeoutMinutes * 60
        )

      core.info(
        `Repo '${repository.full_name}' has '${stopCandidates.length}' stop candidate workflows.`
      )

      for (let j = 0; j < stopCandidates.length; j++) {
        const stoppableRun = stopCandidates[j]
        try {
          await octokit.request(
            `POST /repos/${repository.full_name}/actions/runs/${stoppableRun.id}/cancel`,
            { ...githubHeaders }
          )
          reporter.pushDataRow([
            stoppableRun.repository_fullname,
            stoppableRun.display_title,
            stoppableRun.run_number,
            stoppableRun.id,
            stoppableRun.elapsedTimeInSeconds,
            true
          ])
        } catch (error) {
          core.error(error)
          reporter.pushDataRow([
            stoppableRun.repository_fullname,
            stoppableRun.display_title,
            stoppableRun.run_number,
            stoppableRun.id,
            stoppableRun.elapsedTimeInSeconds,
            false
          ])
        }
      }
    }
  }
}

module.exports = {
  stopLongRunningWorkflows
}
