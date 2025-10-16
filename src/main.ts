import * as core from '@actions/core'
// import * as github from '@actions/github'
import {exec} from 'child_process'
import {basename} from 'path'
import fs from 'fs'
import c from 'ansi-colors'

/**
 * Get the input values and form a configuration object
 * to run the action with.
 *
 * @returns {Object} The configuration object.
 * @property {string} registry - The container registry.
 * @property {string} image_name - The name of the image.
 * @property {string} image_tag - The tag of the image.
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
  registry: string
  image_name: string
  image_tag: string
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
  const registry = core.getInput('registry').trim()
  core.debug(`registry: ${registry}`)
  const image_name = core.getInput('image-name').trim()
  core.debug(`image-name: ${image_name}`)
  const image_tag = core.getInput('image-tag').trim()
  core.debug(`image-tag: ${image_tag}`)

  // Input(s) for configuring the Wordpress CI container
  // before starting it
  const network = core.getInput('network').trim()
  core.debug(`network: ${network}`)
  if (network === '') {
    throw new Error('The network input must be provided and not be empty.')
  }

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
    registry,
    image_name,
    image_tag,
    network,
    plugins,
    db_host,
    db_name,
    db_user,
    db_password,
    themes,
    testCommand,
    testCommandContext
  }
}

/**
 * A simple function to execute command and pipe outputs
 * to core.
 *
 * @param {string[]} cmd - The command to execute.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function _exec(
  cmd: string[],
  options: {
    logStdout: boolean
    logStderr: boolean
    showCommand?: boolean
  } = {
    logStdout: true,
    logStderr: true,
    showCommand: true
  }
): Promise<{stdout: string; stderr: string}> {
  return new Promise((resolve, reject) => {
    // Show the command being executed
    const cmdStr = cmd.join(' ')
    if (options.showCommand) {
      core.info(`> ${c.blue(cmdStr)}`)
    }

    const subprocess = exec(cmdStr)
    let stdout = ''
    let stderr = ''
    subprocess?.stdout?.on('data', (data: string) => {
      stdout += data
      if (options.logStdout) {
        core.info(data.trim())
      }
    })
    subprocess?.stderr?.on('data', (data: string) => {
      stderr += data
      if (options.logStderr) {
        core.info(c.magenta(data.trim()))
      }
    })
    subprocess.on('exit', code => {
      if (code === 0) {
        resolve({
          stdout,
          stderr
        })
      } else {
        reject(
          new Error(
            `Command failed: ${cmd.join(' ')}\nExit code: ${code}\nError: ${stderr}`
          )
        )
      }
    })
  })
}

/**
 * Make sure the container mentioned is running in the background.
 *
 * @param registry
 * @param image_name
 * @param image_tag
 */
async function _ensureContainerRunning(
  registry: string,
  image_name: string,
  image_tag: string,
  network: string,
  container_options: string[] = [],
  container_name = 'wordpress-ci'
): Promise<{stdout: string; stderr: string}> {
  const fullImageName = `${registry}/${image_name}:${image_tag}`
  core.debug(`Ensuring container ${fullImageName} is running...`)

  // Using docker command, check if the container is running.
  // If not, start the container in detached mode.
  // This is a placeholder implementation.
  // In a real implementation, you would use child_process to run docker commands.
  const {stdout} = await _exec([
    'docker',
    'ps',
    '--quiet',
    '--filter',
    `name="${fullImageName}"`
  ])
  core.debug(`docker ps result: ${stdout}`)

  // Run the container in the background
  if (!stdout || stdout.toString().trim() === '') {
    core.debug(`Container ${fullImageName} is not running. Starting it...`)
    const options = [
      '--detach',
      `--name="${container_name}"`,
      '--publish="8080:80"',
      `--env="CLEAN_ON_START=yes"`,
      `--network=${network}`,
      ...container_options
    ]
    const cmd = ['docker', 'run', ...options, fullImageName]
    return _exec(cmd)
  } else {
    core.debug(`Container ${fullImageName} is already running.`)
    return Promise.resolve({stdout: '', stderr: ''})
  }
}

/**
 * Ensure the specified container is stopped.
 * @param container_name
 * @returns {Object}
 * @property {string} stdout - The standard output from the command.
 * @property {string} stderr - The standard error from the command.
 */
async function _ensureContainerStopped(
  container_name: string
): Promise<{stdout: string; stderr: string}> {
  await _exec(['docker', 'container', 'stop', container_name])
  return _exec(['docker', 'container', 'rm', container_name])
}

/**
 * Wait for an HTTP server to be available.
 * @param url An URL on the HTTP server that would return some status if server is on.
 * @param timeout The maximum time to wait, in milliseconds.
 * @returns A promise that resolves when the server is available, or rejects on timeout.
 */
async function _waitForHttpServer(url: string, timeout: number): Promise<void> {
  const startTime = Date.now()

  const {stdout} = await _exec(['docker', 'ps'])
  core.debug(`docker ps result: ${stdout}`)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const result = await _exec(
        [`curl -s -o /dev/null -w "%{http_code}" ${url}`],
        {
          logStdout: false,
          logStderr: false,
          showCommand: false
        }
      )
      if (result.stdout.trim() !== '000') {
        return
      }
      // Wait for a short interval before retrying
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for server at ${url}`)
      }
    }
  }
}

/**
 * Generates a bash script that proxies commands to the container.
 *
 * @param container_command_name The command to run in the container
 * @param container_name The name of the container
 *
 * @returns {string} The bash script content
 */
function _proxiedContainerCommandScript(
  container_name: string,
  container_command_name = ''
): string {
  return `#!/bin/bash

  docker exec -it ${container_name} ${container_command_name} "$@"

  exit $?
  `
}

/**
 * Install a script file with given content if it does not already exist.
 *
 * @param script_fullpath The full path to the script file.
 * @param script_content The content of the script file.
 * @returns {void}
 */
function _installScript(script_fullpath: string, script_content: string): void {
  if (fs.existsSync(script_fullpath)) {
    core.info(
      c.magenta(
        `Script ${script_fullpath} already exists, skipping installation.`
      )
    )
    return
  }
  core.info(c.blue(`Installing script to ${script_fullpath}...`))

  // Write the script content to the file and make it executable
  fs.writeFileSync(script_fullpath, script_content, {mode: 0o755})
}

/**
 * The helper functions that a run function needs.
 * For testing purpose, these functions can be mocked.
 */
export type runEnvironment = {
  ensureContainerRunning?: (
    registry: string,
    image_name: string,
    image_tag: string,
    network: string,
    container_options?: string[],
    container_name?: string
  ) => Promise<{stdout: string; stderr: string}>
  ensureContainerStopped?: (
    container_name: string
  ) => Promise<{stdout: string; stderr: string}>
  installScript?: (script_fullpath: string, script_content: string) => void
  waitForHttpServer?: (url: string, timeout: number) => Promise<void>
}

/**
 * The main function for the action.
 * @returns {void} Completes when the action is done.
 */
export async function run({
  ensureContainerRunning = _ensureContainerRunning,
  ensureContainerStopped = _ensureContainerStopped,
  installScript = _installScript,
  waitForHttpServer = _waitForHttpServer
}: runEnvironment = {}): Promise<void> {
  const startTime = new Date().getTime()
  try {
    const configs = getConfigs()

    const container_options: string[] = [
      `--env="WORDPRESS_DB_HOST=${configs.db_host}"`,
      `--env="WORDPRESS_DB_NAME=${configs.db_name}"`,
      `--env="WORDPRESS_DB_USER=${configs.db_user}"`,
      `--env="WORDPRESS_DB_PASSWORD=${configs.db_password}"`
    ]
    if (configs.plugins.length > 0) {
      container_options.push(
        ...configs.plugins.map(
          plugin =>
            `--volume="${plugin}:/var/www/html/wp-content/plugins/${basename(plugin)}"`
        )
      )
    }
    if (configs.themes.length > 0) {
      container_options.push(
        ...configs.themes.map(
          theme =>
            `--volume="${theme}:/var/www/html/wp-content/themes/${basename(theme)}"`
        )
      )
    }

    core.startGroup('Start Wordpress CI container')
    const container_url = `http://localhost:8080`
    process.env['WORDPRESS_CI_URL'] = container_url
    core.info(`Waiting for Wordpress CI to be available at ${container_url}...`)
    try {
      await ensureContainerRunning(
        configs.registry,
        configs.image_name,
        configs.image_tag,
        configs.network,
        container_options
      )
      await waitForHttpServer(container_url, 10000) // Wait up to 10 seconds
    } catch (error) {
      core.error(
        `Error ensuring container is running: ${(error as Error).message}`
      )
      core.setFailed(
        `Error ensuring container is running: ${(error as Error).message}`
      )
      throw error
    } finally {
      core.endGroup()
    }

    // Install proxy scripts
    const container_name = 'wordpress-ci'
    core.startGroup(
      'Setup proxy script to run command in Wordpress CI container'
    )
    installScript(
      '/usr/local/bin/wpci-cmd',
      _proxiedContainerCommandScript(container_name)
    )
    core.endGroup()

    // Download the frontpage on localhost:8080
    try {
      // change to the test command context directory
      core.info(`Changed directory to ${configs.testCommandContext}`)
      process.chdir(configs.testCommandContext)

      // run the test command
      if (configs.testCommand) {
        core.startGroup('Test Command')
        core.info(configs.testCommand)
        core.endGroup()

        core.startGroup('Test Command Result')
        await _exec([configs.testCommand])
      } else {
        core.info('No test command provided, skipping test execution.')
      }
    } catch (error) {
      core.setFailed(`Error fetching frontpage: ${(error as Error).message}`)
      throw error
    } finally {
      core.endGroup()

      core.startGroup('Stop the Wordpress CI container')
      await ensureContainerStopped('wordpress-ci')
      core.endGroup()
    }

    core.setOutput('stdout', '')
    core.setOutput('stderr', '')
    core.setOutput('time', new Date().getTime() - startTime)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
