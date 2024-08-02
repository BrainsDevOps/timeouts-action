function markdownTable(data) {
  try {
    if (data.length === 0) return ''

    const getMaxColumnWidths = dataTable => {
      const numCols = data[0].length
      const colWidths = new Array(numCols).fill(0)
      for (const row of dataTable) {
        for (const cell of row) {
          const index = row.indexOf(cell)
          colWidths[index] = Math.max(colWidths[index], cell.length)
        }
      }
      return colWidths
    }

    const padCell = (cell, length) => cell + ' '.repeat(length - cell.length)

    const createRow = (row, colWidths) =>
      `| ${row.map((cell, index) => padCell(cell, colWidths[index])).join(' | ')} |`

    const colWidths = getMaxColumnWidths(data)
    const headerRow = createRow(data[0], colWidths)
    const separatorRow = `| ${colWidths.map(width => '-'.repeat(width)).join(' | ')} |`
    const dataRows = data
      .slice(1)
      .map(row => createRow(row, colWidths))
      .join('\n')

    return dataRows
      ? `${headerRow}\n${separatorRow}\n${dataRows}`
      : `${headerRow}\n${separatorRow}`
  } catch (error) {
    console.error(error)
  }
}

module.exports = markdownTable
