const { App } = require('octokit')
require('dotenv/config')
const core = require('@actions/core')
const { Reporter } = require('./reporter')
const workflowKiller = require('./workflow-killer')

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

    // Initialize the app for the rest api calls
    const app = new App({ appId, privateKey })

    // Write the outcome of each call to stop a workflow
    const reporter = new Reporter()

    await workflowKiller.stopLongRunningWorkflows(
      app,
      scanRangeDays,
      stoppableStates,
      timeoutMinutes,
      reporter
    )

    core.setOutput('report', reporter.getData())
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
