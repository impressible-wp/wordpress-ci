import * as core from '@actions/core'
import * as exec from '@actions/exec'
import fs from 'fs'
import c from 'ansi-colors'

/**
 * A simple function to execute command and pipe outputs
 * to core using @actions/exec for GitHub Actions compatibility.
 *
 * @param {string[]} cmd - The command to execute.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function _exec(
  cmd: string[],
  options: {
    logStdout: boolean
    logStderr: boolean
    showCommand?: boolean
    useTty?: boolean
  } = {
    logStdout: false,
    logStderr: true,
    showCommand: false,
    useTty: true
  }
): Promise<{stdout: string; stderr: string}> {
  // Show the command being executed
  const cmdStr = cmd.join(' ')
  if (options.showCommand) {
    core.info(`> ${c.blue(cmdStr)}`)
  }

  const [command, ...args] = cmd
  if (!command) {
    throw new Error('No command provided')
  }

  let stdout = ''
  let stderr = ''

  const execOptions: exec.ExecOptions = {
    silent: true, // If logStdout is false, run silently
    listeners: {
      stdout: (data: Buffer) => {
        const output = data.toString()
        stdout += output
        if (options.logStdout) {
          core.info(output.trim())
        }
      },
      stderr: (data: Buffer) => {
        const output = data.toString()
        stderr += output
        if (options.logStderr) {
          core.info(c.magenta(output.trim()))
        }
      }
    }
  }

  stdout = ''
  stderr = ''
  const exitCode = await exec.exec(command, args, execOptions)
  if (exitCode === 0) {
    return {stdout, stderr}
  } else {
    core.info(c.red(stderr))
    throw new Error(`command failed: ${cmdStr}\nexit code: ${exitCode}`)
  }
}

/**
 * Execute the given script text as bash shell script.
 *
 * @param script
 * @param options
 * @returns
 */
export async function _shellExec(
  script: string,
  options: {
    logStdout: boolean
    logStderr: boolean
    showCommand?: boolean
    useTty?: boolean
  } = {
    logStdout: true,
    logStderr: true,
    showCommand: false,
    useTty: true
  }
): Promise<{stdout: string; stderr: string}> {
  // Write the script to a temporary file
  // Generate a unique temporary file name
  const tmpScriptPath = `/tmp/temp-script-${Date.now()}.sh`
  fs.writeFileSync(tmpScriptPath, script, {
    mode: 0o644
  })

  core.info(`Executing script: ${script}\n`)

  // Execute the script using bash
  // - "-e": exit immediately if a command exits with a non-zero status
  // - "-u": treat unset variables as an error when substituting
  // - "-x": print each command before executing it
  // - "-o pipefail": the return value of a pipeline is the status of
  //   the last command to exit with a non-zero status,
  //   or zero if no command exited with a non-zero status
  return _exec(['/bin/bash', '-exu', '-o', 'pipefail', tmpScriptPath], options)
}

/**
 * Install a script file with given content if it does not already exist.
 *
 * @param script_fullpath The full path to the script file.
 * @param script_content The content of the script file.
 * @returns {void}
 */
export function _installScript(
  script_fullpath: string,
  script_content: string
): void {
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
