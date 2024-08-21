const moment = require('moment/moment')
const core = require('@actions/core')

const githubHeaders = {
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

const octokitResultsPerPage = 100

async function getActionRunsForRepo(
  octokit,
  repository,
  workflowsSearchRangeInDays
) {
  const allRuns = []
  let page = 1
  let hasMorePages = true

  while (hasMorePages) {
    core.debug(
      `fetching action runs for repo ${repository.full_name}, page ${page}`
    )
    const response = await octokit.request(
      `GET /repos/${repository.full_name}/actions/runs`,
      {
        per_page: octokitResultsPerPage,
        page,
        created: `>${workflowsSearchRangeInDays}`,
        ...githubHeaders
      }
    )

    core.debug(JSON.stringify(response))
    if (response.status === 200) {
      allRuns.push(...response.data.workflow_runs)
      hasMorePages = allRuns.length < response.data.total_count
      // Check if there are more pages to fetch
      page++
    } else {
      hasMorePages = false
      core.error(
        `error retrieving action runs for repo: ${repository.full_name}`
      )
    }
  }

  return allRuns
}

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

  // Iterate through app installations(repositories) and then through workflows
  for await (const { installation } of app.eachInstallation.iterator()) {
    for await (const { octokit, repository } of app.eachRepository.iterator({
      installationId: installation.id
    })) {
      core.info(`Working on ${repository.full_name}`)

      const runs = await getActionRunsForRepo(
        octokit,
        repository,
        workflowsSearchRangeInDays
      )
      // The api doesn't allow to search for more than one state per call
      // So we retrieve all the workflows in the past X days and then we
      // post-filter on the "stoppable" states
      // TODO: fetch in parallel the "stoppable" states, for efficiency
      const stopCandidates = runs
        .filter(run => stoppableStates.includes(run.status))
        .map(run => {
          return {
            repository_fullname: repository.full_name,
            display_title: run.display_title,
            run_number: run.run_number,
            id: run.id,
            elapsedTimeInSeconds: moment
              .duration(now - Date.parse(run.run_started_at))
              .asSeconds()
          }
        })
        .filter(
          filteredRun => filteredRun.elapsedTimeInSeconds > timeoutMinutes * 60
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
        } catch (err) {
          core.error(err)
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
