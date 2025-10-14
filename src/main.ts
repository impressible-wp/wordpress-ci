import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * The main function for the action.
 * @returns {void} Completes when the action is done.
 */
export function run(): void {
  try {
    const workdir = core.getInput('workdir')
    core.debug(`Working directory is: ${workdir}`)

    const testCommand = core.getInput('test-command')
    core.debug(`Test command was: ${testCommand}`)

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.info(`The event payload: ${payload}`)

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
