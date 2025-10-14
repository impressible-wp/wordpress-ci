import {run} from '../src/main'
import * as core from '@actions/core'

// Mock the action's core module
jest.mock('@actions/core')
jest.mock('@actions/github', () => ({
  context: {
    payload: {}
  }
}))

const mockCore = core as jest.Mocked<typeof core>

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets the time output', () => {
    // Set the action's inputs as return values from core.getInput()
    mockCore.getInput.mockImplementation((name: string): string => {
      switch (name) {
        case 'workdir':
          return '/github/workspace'
        case 'test-command':
          return 'test command'
        default:
          return ''
      }
    })

    run()

    expect(mockCore.debug).toHaveBeenCalledWith(
      'Working directory is: /github/workspace'
    )
    expect(mockCore.debug).toHaveBeenCalledWith(
      'Test command was: test command'
    )
    expect(mockCore.setOutput).toHaveBeenCalledWith('time', expect.any(String))
  })

  it('sets a failed status when error occurs', () => {
    // Arrange
    mockCore.getInput.mockImplementation(() => {
      throw new Error('Input error')
    })

    // Act
    run()

    // Assert
    expect(mockCore.setFailed).toHaveBeenCalledWith('Input error')
  })
})
