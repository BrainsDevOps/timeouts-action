// reporter.test.js
const { Reporter } = require('../src/reporter')
const markdownTable = require('../src/markdown')

// Mock the markdownTable function
jest.mock('../src/markdown', () => jest.fn(() => 'mocked markdown table'))

describe('Reporter', () => {
  let reporter

  beforeEach(() => {
    reporter = new Reporter()
  })

  test('should initialize with report headers', () => {
    expect(reporter.data).toEqual([
      [
        'Repository',
        'Workflow Title',
        'Run number',
        'Run Id',
        'Elapsed time (seconds)',
        'Was stopped'
      ]
    ])
  })

  test('should add a new data row', () => {
    const newRow = ['repo1', 'workflow1', 1, 'runId1', 120, false]
    reporter.pushDataRow(newRow)
    expect(reporter.data).toContainEqual(newRow)
  })

  test('should return data in markdown format', () => {
    const result = reporter.getData('markdown')
    expect(markdownTable).toHaveBeenCalledWith(reporter.data)
    expect(result).toBe('mocked markdown table')
  })

  test('should return raw data when format is not markdown', () => {
    const result = reporter.getData('raw')
    expect(result).toEqual(reporter.data)
  })
})
