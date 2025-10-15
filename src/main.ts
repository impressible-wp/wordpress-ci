import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * The main function for the action.
 * @returns {void} Completes when the action is done.
 */
export function run(): void {
  const startTime = new Date().getTime()
  try {
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
