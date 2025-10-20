import * as core from '@actions/core'
import {basename} from 'path'
import c from 'ansi-colors'
import {
  _ensureContainerRunning,
  _ensureContainerStopped,
  _getContainerInfoByDNSName,
  _showContainerLogs,
  _proxiedContainerCommandScript,
  _waitForHttpServer,
  ContainerNetworkInfo,
} from './container'
import {_shellExec, _installScript} from './system'

/**
 * Get the input values and form a configuration object
 * to run the action with.
 *
 * @returns {Object} The configuration object.
 * @property {string} image - The image to use.
 * @property {string} network - The network for the container to use.
 * @property {string[]} plugins - The list of plugin paths.
 * @property {string[]} themes - The list of theme paths.
 * @property {string} db_host - The database host.
 * @property {string} db_name - The database name.
 * @property {string} db_user - The database user.
 * @property {string} db_password - The database password.
 * @property {string} testCommand - The test command to run.
 * @property {string} testCommandContext - The build context path.
 */
function getConfigs(): {
  image: string
  db_host: string
  db_name: string
  db_user: string
  db_password: string
  network: string
  plugins: string[]
  themes: string[]
  testCommand: string
  testCommandContext: string
} {
  // Input(s) for getting the Wordpress CI container image
  const image = core.getInput('image').trim()
  core.debug(`image: ${image}`)

  // Input(s) for configuring the Wordpress CI container
  // before starting it
  const network = core.getInput('network').trim()
  core.debug(`network: ${network}`)

  const pluginsStr = core.getInput('plugins').trim()
  const plugins = pluginsStr
    .split('\n')
    .map(p => p.trim())
    .filter(p => p)
  core.debug(`plugins: ${JSON.stringify(plugins)}`)

  const themesStr = core.getInput('themes').trim()
  const themes = themesStr
    .split('\n')
    .map(t => t.trim())
    .filter(t => t)
  core.debug(`themes: ${JSON.stringify(themes)}`)

  // Input(s) for the installation of Wordpress in the container
  const db_host = core.getInput('db-host').trim()
  core.debug(`db-host: ${db_host}`)
  const db_name = core.getInput('db-name').trim()
  core.debug(`db-name: ${db_name}`)
  const db_user = core.getInput('db-user').trim()
  core.debug(`db-user: ${db_user}`)
  const db_password = core.getInput('db-password').trim()
  if (db_password === '') {
    core.debug(`db-password: [EMPTY]`)
  } else {
    core.debug(`db-password: [REDACTED]`)
  }

  // Input(s) for running tests
  const testCommand = core.getInput('test-command').trim()
  core.debug(`test-command: ${testCommand}`)

  let testCommandContext = core.getInput('test-command-context').trim()
  if (testCommandContext === '') {
    testCommandContext = '.'
  }
  core.debug(`test-command-context: ${testCommandContext}`)

  return {
    image,
    network,
    plugins,
    db_host,
    db_name,
    db_user,
    db_password,
    themes,
    testCommand,
    testCommandContext,
  }
}

/**
 * The helper functions that a run function needs.
 * For testing purpose, these functions can be mocked.
 */
export interface RunEnvironment {
  ensureContainerRunning?: (
    image: string,
    network: string,
    container_options?: string[],
    container_name?: string,
  ) => Promise<{stdout: string; stderr: string}>
  ensureContainerStopped?: (
    container_name: string,
  ) => Promise<{stdout: string; stderr: string}>
  installScript?: (script_fullpath: string, script_content: string) => void
  getContainerInfoByDNSName?: (
    matchString: string,
  ) => Promise<ContainerNetworkInfo>
  showContainerLogs?: (
    container_name: string,
  ) => Promise<{stdout: string; stderr: string}>
  waitForHttpServer?: (url: string, timeout: number) => Promise<void>
}

/**
 * The main function for the action.
 * @returns {void} Completes when the action is done.
 */
export async function run({
  ensureContainerRunning = _ensureContainerRunning,
  ensureContainerStopped = _ensureContainerStopped,
  getContainerInfoByDNSName = _getContainerInfoByDNSName,
  installScript = _installScript,
  showContainerLogs = _showContainerLogs,
  waitForHttpServer = _waitForHttpServer,
}: RunEnvironment = {}): Promise<void> {
  const startTime = new Date().getTime()
  let commandOutput = {stdout: '', stderr: ''}

  try {
    const configs = getConfigs()

    const container_options: string[] = [
      `--env="WORDPRESS_DB_HOST=${configs.db_host}"`,
      `--env="WORDPRESS_DB_NAME=${configs.db_name}"`,
      `--env="WORDPRESS_DB_USER=${configs.db_user}"`,
      `--env="WORDPRESS_DB_PASSWORD=${configs.db_password}"`,
    ]
    if (configs.plugins.length > 0) {
      container_options.push(
        ...configs.plugins.map(
          plugin =>
            `--volume=${plugin}:/var/www/html/wp-content/plugins/${basename(plugin)}`,
        ),
      )
    }
    if (configs.themes.length > 0) {
      container_options.push(
        ...configs.themes.map(
          theme =>
            `--volume=${theme}:/var/www/html/wp-content/themes/${basename(theme)}`,
        ),
      )
    }

    // Determine the network name to use for the wordpress-ci container
    let networkName = configs.network
    if (networkName === '') {
      try {
        core.info(
          'No network specified, will attempt to derive the docker network name from the db hostname.',
        )
        const containerNetworkInfo = await getContainerInfoByDNSName(
          configs.db_host,
        )
        core.info(
          `Found container with DNS name ${configs.db_host} in network ${containerNetworkInfo.NetworkName}.`,
        )
        networkName = containerNetworkInfo.NetworkName
      } catch (error) {
        core.setFailed(
          `Error finding container with DNS name ${configs.db_host}: ${
            (error as Error).message
          }`,
        )
        throw error
      }
    } else {
      core.info(`Using specified network: ${networkName}`)
    }

    core.startGroup('Start Wordpress CI container')
    const container_url = `http://localhost:8080`
    process.env['WORDPRESS_CI_URL'] = container_url
    try {
      await ensureContainerRunning(
        configs.image,
        networkName,
        container_options,
      )
    } catch (error) {
      core.setFailed(`Error starting container: ${(error as Error).message}`)
      throw error
    } finally {
      core.endGroup()
    }

    try {
      core.startGroup('Verify Wordpress CI is up and running...')
      core.info(
        `Waiting for Wordpress CI to be available at ${container_url}...`,
      )
      await waitForHttpServer(container_url, 10000) // Wait up to 10 seconds
      core.info('Confirmed Wordpress CI is up and running.')
    } catch (error) {
      // Something must have gone wrong starting the container
      // Get the logs of the container for debugging
      core.setFailed(
        `Error waiting for Wordpress CI to be available: ${(error as Error).message}`,
      )
      throw error
    } finally {
      await showContainerLogs('wordpress-ci')
      core.endGroup()
    }

    // Install proxy scripts
    const container_name = 'wordpress-ci'
    core.startGroup(
      'Setup proxy script to run command in Wordpress CI container',
    )
    installScript(
      '/usr/local/bin/wpci-cmd',
      _proxiedContainerCommandScript(container_name),
    )
    core.endGroup()

    // Download the frontpage on localhost:8080
    try {
      // change to the test command context directory
      core.startGroup('Change to Test Command Context Directory')
      core.info(`Changed directory to ${configs.testCommandContext}`)
      process.chdir(configs.testCommandContext)
      core.endGroup()

      // run the test command
      if (configs.testCommand) {
        core.startGroup('Run Test Command')
        core.info(c.blue(configs.testCommand))
        core.endGroup()

        commandOutput = (await _shellExec(configs.testCommand)) as {
          stdout: string
          stderr: string
        }
      } else {
        core.info('No test command provided, skipping test execution.')
      }
    } catch (error) {
      core.setFailed(`Error fetching frontpage: ${(error as Error).message}`)
      throw error
    } finally {
      core.startGroup('Stop the Wordpress CI container')
      await ensureContainerStopped('wordpress-ci')
      core.endGroup()
    }

    core.setOutput('stdout', commandOutput.stdout)
    core.setOutput('stderr', commandOutput.stderr)
    core.setOutput('time', new Date().getTime() - startTime)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
