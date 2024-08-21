const core = require('@actions/core')
const moment = require('moment')
const { stopLongRunningWorkflows } = require('../src/workflow-killer')

jest.mock('@actions/core')

jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment')
  const mockMoment = (input, format) => actualMoment(input, format)
  Object.assign(mockMoment, actualMoment)

  return mockMoment
})

describe('stopLongRunningWorkflows', () => {
  let mockOctokit
  let mockApp
  let mockReporter

  beforeEach(() => {
    mockOctokit = {
      request: jest.fn()
    }

    mockApp = {
      eachInstallation: {
        iterator: jest.fn().mockImplementation(function* () {
          yield { installation: { id: 1 } }
        })
      },
      eachRepository: {
        iterator: jest.fn().mockImplementation(function* () {
          yield { octokit: mockOctokit, repository: { full_name: 'test/repo' } }
        })
      }
    }

    mockReporter = {
      pushDataRow: jest.fn()
    }

    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('fetches action runs and stops long running workflows', async () => {
    const mockRun = {
      status: 'in_progress',
      display_title: 'Test Workflow',
      run_number: 1,
      id: 123,
      run_started_at: moment().subtract(2, 'hours').toISOString()
    }

    mockOctokit.request
      .mockResolvedValueOnce({
        status: 200,
        data: {
          workflow_runs: [mockRun],
          total_count: 1
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {}
      })

    const scanRangeDays = 7
    const stoppableStates = ['in_progress', 'queued']
    const timeoutMinutes = 60

    await stopLongRunningWorkflows(
      mockApp,
      scanRangeDays,
      stoppableStates,
      timeoutMinutes,
      mockReporter
    )

    expect(core.info).toHaveBeenCalledWith('Working on test/repo')
    expect(mockOctokit.request).toHaveBeenCalledWith(
      'GET /repos/test/repo/actions/runs',
      expect.objectContaining({
        per_page: 100,
        page: 1,
        created: expect.stringMatching(/\d{4}-\d{2}-\d{2}/)
      })
    )

    expect(mockOctokit.request).toHaveBeenCalledWith(
      'POST /repos/test/repo/actions/runs/123/cancel',
      expect.objectContaining({})
    )

    expect(mockReporter.pushDataRow).toHaveBeenCalledWith([
      'test/repo',
      'Test Workflow',
      1,
      123,
      expect.any(Number),
      true
    ])
  })

  test('handles errors gracefully when stopping workflows', async () => {
    const mockRun = {
      status: 'in_progress',
      display_title: 'Test Workflow',
      run_number: 1,
      id: 123,
      run_started_at: moment().subtract(2, 'hours').toISOString()
    }

    mockOctokit.request
      .mockResolvedValueOnce({
        status: 200,
        data: {
          workflow_runs: [mockRun],
          total_count: 1
        }
      })
      .mockRejectedValueOnce(new Error('Failed to cancel workflow'))

    const scanRangeDays = 7
    const stoppableStates = ['in_progress', 'queued']
    const timeoutMinutes = 60

    await stopLongRunningWorkflows(
      mockApp,
      scanRangeDays,
      stoppableStates,
      timeoutMinutes,
      mockReporter
    )

    expect(core.info).toHaveBeenCalledWith('Working on test/repo')
    expect(mockOctokit.request).toHaveBeenCalledWith(
      'POST /repos/test/repo/actions/runs/123/cancel',
      expect.objectContaining({})
    )

    expect(core.error).toHaveBeenCalledWith(
      new Error('Failed to cancel workflow')
    )

    expect(mockReporter.pushDataRow).toHaveBeenCalledWith([
      'test/repo',
      'Test Workflow',
      1,
      123,
      expect.any(Number),
      false
    ])
  })
})
