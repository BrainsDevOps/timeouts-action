const { App } = require('octokit')
const moment = require('moment')
const markdownTable = require('./markdown')
require('dotenv/config')
const core = require('@actions/core')

const run = async () => {
  try {
    // Inputs
    const appId =
      core.getInput('app-id') || process.env.GHA_WORKFLOWS_CLEANER_APP_ID
    const privateKey =
      core.getInput('app-pk') || process.env.GHA_WORKFLOWS_CLEANER_PRIVATE_KEY
    const scanRangeDaysInput = core.getInput('scan-range-days') || '2'
    const timeoutMinutesInput = core.getInput('timeout-minutes') || '200'
    const scanRangeDays = Number(scanRangeDaysInput)
    const timeoutMinutes = Number(timeoutMinutesInput)

    core.info(
      `Using the following inputs: scanRangeDays ${scanRangeDays}, timeoutMinutes:  ${timeoutMinutes}.`
    )

    // Constants
    const stoppableStates = ['in_progress']
    const githubHeaders = {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }

    // Initialize the app for the rest api calls
    const app = new App({ appId, privateKey })
    const { data } = await app.octokit.request('/app')
    console.log('authenticated as %s', data.name)

    // Initialize time ranges
    const now = Date.now()
    const daysAgo = moment()
      .subtract(Number(scanRangeDays), 'days')
      .format('YYYY-MM-DD')

    // Prepare the structure for the report
    const reportHeaders = [
      'Repository',
      'Workflow Title',
      'Run number',
      'Run Id',
      'Elapsed time (seconds)',
      'Was stopped'
    ]
    const report = [reportHeaders]

    // Iterate through app installations(repositories) and then through workflows
    for await (const { installation } of app.eachInstallation.iterator()) {
      for await (const { octokit, repository } of app.eachRepository.iterator({
        installationId: installation.id
      })) {
        console.log(`Working on ${repository.full_name}`)
        const runs = await octokit.request(
          `GET /repos/${repository.full_name}/actions/runs`,
          {
            per_page: 100,
            created: `>${daysAgo}`,
            ...githubHeaders
          }
        )
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

        console.log(
          `Repo '${repository.full_name}' has '${stopCandidates.length}' stop candidate workflows.`
        )
        for (let j = 0; j < stopCandidates.length; j++) {
          const stoppableRun = stopCandidates[j]
          try {
            await octokit.request(
              `POST /repos/${repository.full_name}/actions/runs/${stoppableRun.id}/cancel`,
              { ...githubHeaders }
            )
            report.push([
              stoppableRun.repository_fullname,
              stoppableRun.display_title,
              stoppableRun.run_number,
              stoppableRun.id,
              stoppableRun.elapsedTimeInSeconds,
              true
            ])
          } catch (error) {
            console.error(error)
            report.push([
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

    core.setOutput('report', markdownTable(report))
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
