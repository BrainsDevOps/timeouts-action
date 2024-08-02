const markdownTable = require('../src/markdown')

describe('markdownTable', () => {
  it('should create a markdown table from given data', async () => {
    const data = [
      ['Branch', 'Commit'],
      ['main', '0123456789abcdef'],
      ['staging', 'fedcba9876543210']
    ]

    const expectedOutput = `| Branch  | Commit           |
| ------- | ---------------- |
| main    | 0123456789abcdef |
| staging | fedcba9876543210 |`

    expect(markdownTable(data)).toBe(expectedOutput)
  })

  test('should handle empty data', () => {
    const data = []

    const expectedOutput = ''

    expect(markdownTable(data)).toBe(expectedOutput)
  })

  test('should handle data with only headers', () => {
    const data = [['Branch', 'Commit']]

    const expectedOutput = `| Branch | Commit |
| ------ | ------ |`

    expect(markdownTable(data)).toBe(expectedOutput)
  })

  test('should handle single row of data', () => {
    const data = [
      ['Branch', 'Commit'],
      ['main', '0123456789abcdef']
    ]

    const expectedOutput = `| Branch | Commit           |
| ------ | ---------------- |
| main   | 0123456789abcdef |`

    expect(markdownTable(data)).toBe(expectedOutput)
  })

  test('should handle multiple rows of data', () => {
    const data = [
      ['Branch', 'Commit'],
      ['main', '0123456789abcdef'],
      ['staging', 'fedcba9876543210'],
      ['feature', '1234567890abcdef']
    ]

    const expectedOutput = `| Branch  | Commit           |
| ------- | ---------------- |
| main    | 0123456789abcdef |
| staging | fedcba9876543210 |
| feature | 1234567890abcdef |`

    expect(markdownTable(data)).toBe(expectedOutput)
  })

  test('should handle columns with varying lengths', () => {
    const data = [
      ['Branch', 'Commit', 'Author'],
      ['main', '0123456789abcdef', 'Alice'],
      ['staging', 'fedcba9876543210', 'Bob']
    ]

    const expectedOutput = `| Branch  | Commit           | Author |
| ------- | ---------------- | ------ |
| main    | 0123456789abcdef | Alice  |
| staging | fedcba9876543210 | Bob    |`

    expect(markdownTable(data)).toBe(expectedOutput)
  })
})
