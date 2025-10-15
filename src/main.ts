import * as core from '@actions/core'
import * as github from '@actions/github'

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
 * The main function for the action.
 * @returns {void} Completes when the action is done.
 */
export function run(): void {
  const startTime = new Date().getTime()
  try {
    const configs = getConfigs()
    core.debug(`Test command was: ${configs.testCommand}`)

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
