import * as core from '@actions/core'
import {_exec} from './system'

/**
 * Make sure the container mentioned is running in the background.
 *
 * @param registry
 * @param image_name
 * @param image_tag
 */
export async function _ensureContainerRunning(
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
      `--name=${container_name}`,
      '--publish=8080:80',
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
export async function _ensureContainerStopped(
  container_name: string
): Promise<{stdout: string; stderr: string}> {
  await _exec(['docker', 'container', 'stop', container_name])
  return _exec(['docker', 'container', 'rm', container_name])
}

/**
 * Generates a bash script that proxies commands to the container.
 *
 * @param container_command_name The command to run in the container
 * @param container_name The name of the container
 *
 * @returns {string} The bash script content
 */
export function _proxiedContainerCommandScript(
  container_name: string,
  container_command_name = ''
): string {
  return `#!/bin/bash

  docker exec -i ${container_name} ${container_command_name} "$@"

  exit $?
  `
}

/**
 * Wait for an HTTP server to be available.
 * @param url An URL on the HTTP server that would return some status if server is on.
 * @param timeout The maximum time to wait, in milliseconds.
 * @returns A promise that resolves when the server is available, or rejects on timeout.
 */
export async function _waitForHttpServer(
  url: string,
  timeout: number
): Promise<void> {
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
