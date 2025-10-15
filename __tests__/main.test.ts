import {run, runEnvironment} from '../src/main'
import * as core from '@actions/core'

// Mock the action's core module
jest.mock('@actions/core')
jest.mock('@actions/github', () => ({
  context: {
    payload: {}
  }
}))

const mockCore = core as jest.Mocked<typeof core>

function mockRunEnvironment(): runEnvironment {
  const ensureContainerRunning = jest.fn()
  const waitForHttpServer = jest.fn()
  const getContent = jest.fn().mockReturnValue('<html>Mocked Content</html>')

  return {
    ensureContainerRunning,
    waitForHttpServer,
    getContent
  }
}

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets common input', async () => {
    // Set the action's inputs as return values from core.getInput()
    mockCore.getInput.mockImplementation((name: string): string => {
      switch (name) {
        case 'registry':
          return 'registry.io'
        case 'image_name':
          return 'some-vendor/image-name'
        case 'image_tag':
          return 'some-image-tag'
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

    const mockRunEnv = mockRunEnvironment()
    await run(mockRunEnv)

    // Assert the inputs
    expect(mockCore.debug).toHaveBeenCalledWith('registry: registry.io')
    expect(mockCore.debug).toHaveBeenCalledWith(
      'image_name: some-vendor/image-name'
    )
    expect(mockCore.debug).toHaveBeenCalledWith('image_tag: some-image-tag')
    expect(mockCore.debug).toHaveBeenCalledWith(
      `plugins: ${JSON.stringify(['./plugin1', './plugin2'])}`
    )
    expect(mockCore.debug).toHaveBeenCalledWith(
      `themes: ${JSON.stringify(['./theme1', './theme2'])}`
    )
    expect(mockCore.debug).toHaveBeenCalledWith('context: ./example')
    expect(mockCore.debug).toHaveBeenCalledWith('test-command: test command')

    // Assert the container running function was called with correct params
    expect(mockRunEnv.ensureContainerRunning).toHaveBeenCalledWith(
      'registry.io',
      'some-vendor/image-name',
      'some-image-tag'
    )

    // Assert the outputs
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

  it('sets empty values', async () => {
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

    const mockRunEnv = mockRunEnvironment()
    await run(mockRunEnv)

    // Assert the outputs and debug messages
    expect(mockCore.debug).toHaveBeenCalledWith(
      `plugins: ${JSON.stringify([])}`
    )
    expect(mockCore.debug).toHaveBeenCalledWith(`themes: ${JSON.stringify([])}`)
    expect(mockCore.debug).toHaveBeenCalledWith('context: .')
  })

  it('sets a failed status when error occurs', async () => {
    // Arrange
    mockCore.getInput.mockImplementation(() => {
      throw new Error('Input error')
    })

    const mockRunEnv = mockRunEnvironment()
    await run(mockRunEnv)

    // Assert
    expect(mockCore.setFailed).toHaveBeenCalledWith('Input error')
  })
})
