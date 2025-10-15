import * as core from '@actions/core'
import * as github from '@actions/github'
import {exec, ExecException, execSync} from 'child_process'

/**
 * Get the input values and form a configuration object
 * to run the action with.
 *
 * @returns {Object} The configuration object.
 * @property {string} registry - The container registry.
 * @property {string} image_name - The name of the image.
 * @property {string} image_tag - The tag of the image.
 * @property {string[]} plugins - The list of plugin paths.
 * @property {string[]} themes - The list of theme paths.
 * @property {string} context - The build context path.
 * @property {string} testCommand - The test command to run.
 */
function getConfigs(): {
  registry: string
  image_name: string
  image_tag: string
  plugins: string[]
  themes: string[]
  context: string
  testCommand: string
} {
  const registry = core.getInput('registry').trim()
  core.debug(`registry: ${registry}`)
  const image_name = core.getInput('image_name').trim()
  core.debug(`image_name: ${image_name}`)
  const image_tag = core.getInput('image_tag').trim()
  core.debug(`image_tag: ${image_tag}`)

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

  let context = core.getInput('context').trim()
  if (context === '') {
    context = '.'
  }
  core.debug(`context: ${context}`)

  const testCommand = core.getInput('test-command').trim()
  core.debug(`test-command: ${testCommand}`)

  return {
    registry,
    image_name,
    image_tag,
    plugins,
    themes,
    context,
    testCommand
  }
}

/**
 * Make sure the container mentioned is running in the background.
 *
 * @param registry
 * @param image_name
 * @param image_tag
 */
function ensureContainerRunning(
  registry: string,
  image_name: string,
  image_tag: string
): void {
  const fullImageName = `${registry}/${image_name}:${image_tag}`
  core.debug(`Ensuring container ${fullImageName} is running...`)

  // Using docker command, check if the container is running.
  // If not, start the container in detached mode.
  // This is a placeholder implementation.
  // In a real implementation, you would use child_process to run docker commands.
  const stdout = execSync(`docker ps -q -f "name=${fullImageName}"`)
  core.debug(`docker ps result: ${stdout?.toString()}`)

  // Run the container in the background
  if (!stdout || stdout.toString().trim() === '') {
    core.debug(`Container ${fullImageName} is not running. Starting it...`)
    const handle = _getCommandOutputHandler()
    exec(
      `docker run -d --name ${fullImageName} ${fullImageName}`,
      handle.callback
    )
  } else {
    core.debug(`Container ${fullImageName} is already running.`)
  }

  core.debug(`Container ${fullImageName} is running.`)
}

/**
 * Create a child process output handler.
 *
 * @returns An object containing a callback function and an output handle.
 * The callback function captures the output of a command execution.
 * The output handle contains the error, stdout, stderr, and a done flag.
 * @see https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
 */
function _getCommandOutputHandler(): {
  callback: (
    error: ExecException | null,
    stdout: string,
    stderr: string
  ) => void
  output: {
    error: ExecException | null
    stdout: string
    stderr: string
    done: boolean
  }
} {
  const outputHandle = {
    error: null as ExecException | null,
    stdout: '',
    stderr: '',
    done: false
  }
  const handler = (
    error: ExecException | null,
    stdout: string,
    stderr: string
  ): void => {
    if (error) {
      outputHandle.error = error
    }
    if (stdout) {
      outputHandle.stdout = stdout
    }
    if (stderr) {
      outputHandle.stderr = stderr
    }
    outputHandle.done = true
  }

  return {
    callback: handler,
    output: outputHandle
  }
}

/**
 * The main function for the action.
 * @returns {void} Completes when the action is done.
 */
export function run({
  _ensureContainerRunning = ensureContainerRunning
}: {
  _ensureContainerRunning?: (
    registry: string,
    image_name: string,
    image_tag: string
  ) => void
} = {}): void {
  const startTime = new Date().getTime()
  try {
    const configs = getConfigs()
    core.debug(`Test command was: ${configs.testCommand}`)

    _ensureContainerRunning(
      configs.registry,
      configs.image_name,
      configs.image_tag
    )

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.info(`The event payload: ${payload}`)

    core.setOutput('stdout', '')
    core.setOutput('stderr', '')
    core.setOutput('time', new Date().getTime() - startTime)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
