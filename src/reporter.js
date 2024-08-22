const markdownTable = require('./markdown')

const reportHeaders = [
  'Repository',
  'Workflow Title',
  'Run number',
  'Run Id',
  'Elapsed time (seconds)',
  'Was stopped'
]

class Reporter {
  constructor() {
    this.data = [reportHeaders]
  }

  pushDataRow(row) {
    this.data.push(row)
  }

  getData(format = 'markdown') {
    if (format === 'markdown') {
      return markdownTable(this.data)
    }
    return this.data
  }
}

exports.Reporter = Reporter
