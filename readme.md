# Timeouts action

## WHAT is this action?

This action Checks for all running jobs in the past X days and cancels any jobs
that had been running for more than a specified timeout.

## WHY do we need this action?

Sometimes our jobs misbehave and end up running for more time than intended.
Installs that don't finish, network problems, etc.

You can protect yourself from these kinds of situations by setting timeouts on
the job and the step level:

- [job](https://docs.github.com/es/actions/writing-workflows/workflow-syntax-for-github-actions#jobsjob_idtimeout-minutes)
- [step](https://docs.github.com/es/actions/writing-workflows/workflow-syntax-for-github-actions#jobsjob_idstepstimeout-minutes)

So if you remember to set this up on every workflow and job. Good for you!

The problem is that currently there is no way to define a
[global default timeout across organizations](https://github.com/orgs/community/discussions/14834)

And this can make you waste resources and money unnecessarily when your
workflows misbehave.

These are the time limits for GitHub and self-hosted runners:

- [GitHub runners](https://docs.github.com/en/actions/administering-github-actions/usage-limits-billing-and-administration#usage-limits)
  - job: 6 hours
  - workflow: 35 days
- [Self Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#usage-limits)
  - job: 5 days
  - workflow: 35 days

Those limits are huge! So this action provides a failsafe to kill workflows that
had been running for more time than the threshold you define.

## HOW to use this action

The idea is to invoke this action periodically with the configuration you
define. You could write a scheduled workflow. As an example:

```yaml
name: Workflow to check for long running workflows
on:
  workflow_dispatch:
  # Schedule the check every 30 minutes
  schedule:
    - cron: '*/30 * * * *'

jobs:
  check-running-jobs:
    name: Job to check for long running jobs
    runs-on: ubuntu-latest

    steps:
      - name: Call workflow cleaner
        uses: BrainsDevOps/timeouts-action@v1
        id: cleaner
        with:
          app-id: ${{secrets.GHA_WORKFLOWS_CLEANER_APP_ID}}
          app-pk: ${{secrets.GHA_WORKFLOWS_CLEANER_PRIVATE_KEY}}
          timeout-minutes: 1

      - name: Summary
        run: |
          echo "# Workflow cleaner summary" >> $GITHUB_STEP_SUMMARY
          echo "${{steps.cleaner.outputs.report}}" >> $GITHUB_STEP_SUMMARY
```

By default, a workflow only has permissions over itself, so in order for this to
work on other repositories, you'll need to configure a GitHub Apps that grants
sufficient API permissions to list workflows and cancel them.

### Steps for the setup

- Create a GitHub App with the following permissions
  - Read access to metadata
  - Read and write access to actions
- Create a private Key associated to the GitHub App
- Install the App in the organization/repositories that you want to be monitored
  by the App
- Store the GitHub App and Private Key as secrets that can be accessed by the
  scheduled job. In the example:
  - GHA_WORKFLOWS_CLEANER_APP_ID - provided as parameter to the action in
    'app-id'
  - GHA_WORKFLOWS_CLEANER_PRIVATE_KEY - provided as parameter to the action in
    'app-pk'

Note: You should store the private key contents as-is (without encoding to
base64)

You might find these resources useful if you need guidance on the GitHub App
installation and setup:

- [Creating/Installing your own GitHub App](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app)
- [Generating Private Keys for the GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps#generating-private-keys)

## Inputs

- app-id: The App Id from the GitHub App used to query the GitHub API across the
  repositories
  - The GitHub App need to be installed on the monitored repositories
  - The app needs the following permissions
    - Read access to metadata
    - Read and write access to actions
- app-pk: The private key associated to the GitHub App
- scan-range-days: The number of days used to query for ongoing jobs
- timeout-minutes: The number of minutes after we consider that a job should be
  cancelled

## Outputs

- report: A Markdown table containing information about the changes done by the
  process
  - Repository
  - Workflow title
  - Run number: The run number (used friendly number for the run - order inside
    the repo)
  - Run Id: Technical Id of the run
  - Elapsed time s: The time that has passed since the job started
  - Was stopped: Boolean value that informs whether the job could actually be
    stopped

## Modifying the code

If the javascript code in the action is modified, the dist folder needs to be
rebuilt with @vercel/ncc. Use the `npm run build` script

## Local testing

You can test the javascript code locally by defining your GitHub appId and
private key (base64 encoded) in the a .env file. An example of the expected
properties can be found in under src/.env.example.

## Built with javascript-action template

The skeleton of this action was created using the
[javascript-action](https://github.com/actions/javascript-action) template. It
provides tools for linting, testing, etc.

## Some useful links

- [Octokit.js](https://github.com/octokit/octokit.js)
- [GitHub Apps](https://docs.github.com/en/apps)
