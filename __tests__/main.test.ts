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

  it('sets common input', () => {
    // Set the action's inputs as return values from core.getInput()
    mockCore.getInput.mockImplementation((name: string): string => {
      switch (name) {
        case 'plugins':
          return './plugin1\n./plugin2'
        case 'themes':
          return './theme1\n./theme2'
        case 'context':
          return './example'
        case 'test-command':
          return 'test command'
        default:
          return ''
      }
    })

    run()

    // Assert the outputs and debug messages
    expect(mockCore.debug).toHaveBeenCalledWith(
      `plugins: ${JSON.stringify(['./plugin1', './plugin2'])}`
    )
    expect(mockCore.debug).toHaveBeenCalledWith(
      `themes: ${JSON.stringify(['./theme1', './theme2'])}`
    )
    expect(mockCore.debug).toHaveBeenCalledWith('context: ./example')
    expect(mockCore.debug).toHaveBeenCalledWith('test-command: test command')
    expect(mockCore.setOutput).toHaveBeenCalledWith(
      'stdout',
      expect.any(String)
    )
    expect(mockCore.setOutput).toHaveBeenCalledWith(
      'stderr',
      expect.any(String)
    )
    expect(mockCore.setOutput).toHaveBeenCalledWith('time', expect.any(Number))
  })

  it('sets empty values', () => {
    mockCore.getInput.mockImplementation((name: string): string => {
      switch (name) {
        case 'plugins':
          return ''
        case 'themes':
          return ''
        case 'context':
          return ''
        default:
          return ''
      }
    })

    run()

    // Assert the outputs and debug messages
    expect(mockCore.debug).toHaveBeenCalledWith(
      `plugins: ${JSON.stringify([])}`
    )
    expect(mockCore.debug).toHaveBeenCalledWith(`themes: ${JSON.stringify([])}`)
    expect(mockCore.debug).toHaveBeenCalledWith('context: .')
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
