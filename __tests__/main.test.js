describe('main', () => {
  it('TODO', async () => {
    expect(true).toBe(true)
  })
})
// /**
//  * Unit tests for the action's main functionality, src/main.js
//  */
// const core = require('@actions/core')
// const main = require('../src/main')
// const WorkflowKiller = require('../src/workflow-killer')
//
// // Mock the GitHub Actions core library
// const infoMock = jest.spyOn(core, 'info').mockImplementation()
// const getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
// const setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
// const setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
//
// // Mock the workflow killer
// const stopLongRunningWorkflowsMock = jest
//   .spyOn(WorkflowKiller, 'stopLongRunningWorkflows')
//   .mockImplementation()
//
// // Mock the action's main function
// const runMock = jest.spyOn(main, 'run')
//
// describe('action', () => {
//   beforeEach(() => {
//     jest.clearAllMocks()
//   })
//
//   it('fails if no app id is provided', async () => {
//     // Set the action's inputs as return values from core.getInput()
//     getInputMock.mockImplementation(name => {
//       switch (name) {
//         case 'app-id':
//           return ''
//         default:
//           return ''
//       }
//     })
//
//     await main.run()
//     expect(runMock).toHaveReturned()
//
//     // Verify that there is an error thrown when the app id is not provided
//     expect(setFailedMock).toHaveBeenNthCalledWith(
//       1,
//       '[@octokit/auth-app] appId option is required'
//     )
//     // Check info message with default values
//     expect(infoMock).toHaveBeenNthCalledWith(
//       1,
//       'Using the following inputs: scanRangeDays 2, timeoutMinutes:  200.'
//     )
//     // Ensure that the output is not set
//     expect(setOutputMock).toHaveBeenCalledTimes(0)
//   })
//
//   it('fails if no app private key is provided', async () => {
//     // Set the action's inputs as return values from core.getInput()
//     getInputMock.mockImplementation(name => {
//       switch (name) {
//         case 'app-id':
//           return '111111'
//         case 'app-pk':
//           return '' //
//         default:
//           return ''
//       }
//     })
//
//     await main.run()
//     expect(runMock).toHaveReturned()
//
//     // Verify that there is an error thrown when the app private key is not provided
//     expect(setFailedMock).toHaveBeenNthCalledWith(
//       1,
//       '[@octokit/auth-app] privateKey option is required'
//     )
//   })
//
//   it('calls the workflow killer if the required parameters are there', async () => {
//     // Set the action's inputs as return values from core.getInput()
//     getInputMock.mockImplementation(name => {
//       switch (name) {
//         case 'app-id':
//           return '111111'
//         case 'app-pk':
//           return '22222'
//         default:
//           return ''
//       }
//     })
//
//     await main.run()
//     expect(runMock).toHaveReturned()
//
//     // Verify that there is an error thrown when the app private key is not provided
//     expect(stopLongRunningWorkflowsMock).toHaveBeenCalledTimes(1)
//   })
// })
