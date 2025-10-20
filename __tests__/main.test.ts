import {run, RunEnvironment} from '../src/main'
import * as core from '@actions/core'

// Mock the action's core module
jest.mock('@actions/core')
jest.mock('@actions/github', () => ({
  context: {
    payload: {},
  },
}))

const mockCore = core as jest.Mocked<typeof core>

function mockRunEnvironment(): RunEnvironment {
  const ensureContainerRunning = jest.fn()
  const ensureContainerStopped = jest.fn()
  const getContainerInfoByDNSName = jest.fn().mockResolvedValue({
    NetworkName: 'test-network',
    DNSNames: ['test-dns-name'],
    ContainerInfo: {},
  })
  const showContainerLogs = jest.fn()
  const installScript = jest.fn()
  const waitForHttpServer = jest.fn()

  return {
    ensureContainerRunning,
    ensureContainerStopped,
    getContainerInfoByDNSName,
    installScript,
    showContainerLogs,
    waitForHttpServer,
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
        case 'image':
          return 'registry.io/some-vendor/image-name:some-image-tag'
        case 'network':
          return 'some-network'
        case 'plugins':
          return './plugin1\n./plugin2'
        case 'themes':
          return './theme1\n./theme2'
        case 'db-host':
          return 'some-db-host'
        case 'db-name':
          return 'some-db-name'
        case 'db-user':
          return 'some-db-user'
        case 'db-password':
          return 'some-db-password'
        case 'clean-on-start':
          return 'true'
        case 'import-sql':
          return './some-db-export.sql'
        case 'test-command':
          return 'test command'
        case 'test-command-context':
          return './example'
        default:
          return ''
      }
    })

    const mockRunEnv = mockRunEnvironment()
    await run(mockRunEnv)

    // Assert the inputs
    expect(mockCore.debug).toHaveBeenCalledWith(
      'image: registry.io/some-vendor/image-name:some-image-tag',
    )
    expect(mockCore.debug).toHaveBeenCalledWith('network: some-network')

    expect(mockCore.debug).toHaveBeenCalledWith('db-host: some-db-host')
    expect(mockCore.debug).toHaveBeenCalledWith('db-name: some-db-name')
    expect(mockCore.debug).toHaveBeenCalledWith('db-user: some-db-user')
    expect(mockCore.debug).toHaveBeenCalledWith('db-password: [REDACTED]')

    expect(mockCore.debug).toHaveBeenCalledWith('clean-on-start: true')

    expect(mockCore.debug).toHaveBeenCalledWith(
      'import-sql: ./some-db-export.sql',
    )

    expect(mockCore.debug).toHaveBeenCalledWith(
      `plugins: ${JSON.stringify(['./plugin1', './plugin2'])}`,
    )
    expect(mockCore.debug).toHaveBeenCalledWith(
      `themes: ${JSON.stringify(['./theme1', './theme2'])}`,
    )
    expect(mockCore.debug).toHaveBeenCalledWith('test-command: test command')
    expect(mockCore.debug).toHaveBeenCalledWith(
      'test-command-context: ./example',
    )

    // Assert the container running function was called with correct params
    expect(mockRunEnv.ensureContainerRunning).toHaveBeenCalledWith(
      'registry.io/some-vendor/image-name:some-image-tag',
      'some-network',
      [
        '--env="WORDPRESS_DB_HOST=some-db-host"',
        '--env="WORDPRESS_DB_NAME=some-db-name"',
        '--env="WORDPRESS_DB_USER=some-db-user"',
        '--env="WORDPRESS_DB_PASSWORD=some-db-password"',
        '--env="CLEAN_ON_START=yes"',
        '--volume=./plugin1:/var/www/html/wp-content/plugins/plugin1',
        '--volume=./plugin2:/var/www/html/wp-content/plugins/plugin2',
        '--volume=./theme1:/var/www/html/wp-content/themes/theme1',
        '--volume=./theme2:/var/www/html/wp-content/themes/theme2',
        '--env="IMPORT_SQL_FILE=/opt/imports/import.sql"',
        '--volume=./some-db-export.sql:/opt/imports/import.sql',
      ],
    )

    // Assert the outputs
    expect(mockCore.setOutput).toHaveBeenCalledWith(
      'stdout',
      expect.any(String),
    )
    expect(mockCore.setOutput).toHaveBeenCalledWith(
      'stderr',
      expect.any(String),
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
        case 'test-command-context':
          return ''
        case 'network':
          return 'some-network' // network must be set
        default:
          return ''
      }
    })

    const mockRunEnv = mockRunEnvironment()
    await run(mockRunEnv)

    // Assert the outputs and debug messages
    expect(mockCore.debug).toHaveBeenCalledWith(
      `plugins: ${JSON.stringify([])}`,
    )
    expect(mockCore.debug).toHaveBeenCalledWith(`themes: ${JSON.stringify([])}`)
    expect(mockCore.debug).toHaveBeenCalledWith('test-command-context: .')
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
