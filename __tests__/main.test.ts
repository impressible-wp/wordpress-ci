import {run, RunEnvironment} from '../src/main'
import * as core from '@actions/core'
import {basename, resolve} from 'path'

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
          return './plugin1\n./plugin2\n.'
        case 'plugins-mapped':
          return './plugin1-mapped\n./plugin2-mapped'
        case 'themes':
          return './theme1\n./theme2'
        case 'themes-mapped':
          return './theme1-mapped\n./theme2-mapped'
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
      `plugins: ${JSON.stringify(['./plugin1', './plugin2', '.'])}`,
    )
    expect(mockCore.debug).toHaveBeenCalledWith(
      `plugins-mapped: ${JSON.stringify(['./plugin1-mapped', './plugin2-mapped'])}`,
    )
    expect(mockCore.debug).toHaveBeenCalledWith(
      `themes: ${JSON.stringify(['./theme1', './theme2'])}`,
    )
    expect(mockCore.debug).toHaveBeenCalledWith(
      `themes-mapped: ${JSON.stringify(['./theme1-mapped', './theme2-mapped'])}`,
    )
    expect(mockCore.debug).toHaveBeenCalledWith('test-command: test command')
    expect(mockCore.debug).toHaveBeenCalledWith(
      'test-command-context: ./example',
    )

    // Make sure the plugin name resolve works with '.'
    expect(basename(resolve('.'))).not.toBe('.')

    // Assert the container running function was called with correct params
    expect(mockRunEnv.ensureContainerRunning).toHaveBeenCalledWith(
      'registry.io/some-vendor/image-name:some-image-tag',
      'some-network',
      [
        '--env=WORDPRESS_DB_HOST=some-db-host',
        '--env=WORDPRESS_DB_NAME=some-db-name',
        '--env=WORDPRESS_DB_USER=some-db-user',
        '--env=WORDPRESS_DB_PASSWORD=some-db-password',
        '--env=CLEAN_ON_START=yes',
        `--volume=${resolve('./plugin1')}:/usr/src/wordpress-ci/plugins/plugin1`,
        `--volume=${resolve('./plugin2')}:/usr/src/wordpress-ci/plugins/plugin2`,
        `--volume=${resolve('.')}:/usr/src/wordpress-ci/plugins/${basename(resolve('.'))}`,
        `--volume=${resolve('./plugin1-mapped')}:/usr/src/wordpress-ci/plugins-mapped/plugin1-mapped`,
        `--volume=${resolve('./plugin2-mapped')}:/usr/src/wordpress-ci/plugins-mapped/plugin2-mapped`,
        `--volume=${resolve('./theme1')}:/usr/src/wordpress-ci/themes/theme1`,
        `--volume=${resolve('./theme2')}:/usr/src/wordpress-ci/themes/theme2`,
        `--volume=${resolve('./theme1-mapped')}:/usr/src/wordpress-ci/themes-mapped/theme1-mapped`,
        `--volume=${resolve('./theme2-mapped')}:/usr/src/wordpress-ci/themes-mapped/theme2-mapped`,
        `--env=IMPORT_SQL_FILE=/usr/src/wordpress-ci/import/import.sql`,
        `--volume=./some-db-export.sql:/usr/src/wordpress-ci/import/import.sql`,
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
