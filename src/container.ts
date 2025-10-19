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
  image: string,
  network: string,
  container_options: string[] = [],
  container_name = 'wordpress-ci'
): Promise<{stdout: string; stderr: string}> {
  core.debug(`Ensuring container ${image} is running...`)

  // Using docker command, check if the container is running.
  // If not, start the container in detached mode.
  // This is a placeholder implementation.
  // In a real implementation, you would use child_process to run docker commands.
  const {stdout} = await _exec([
    'docker',
    'ps',
    '--quiet',
    '--filter',
    `name="${image}"`
  ])
  core.debug(`docker ps result: ${stdout}`)

  // Run the container in the background
  if (!stdout || stdout.toString().trim() === '') {
    core.debug(`Container ${image} is not running. Starting it...`)
    const options = [
      '--detach',
      `--name=${container_name}`,
      '--publish=8080:80',
      `--env="CLEAN_ON_START=yes"`,
      `--network=${network}`,
      ...container_options
    ]
    const cmd = ['docker', 'run', ...options, image]
    return _exec(cmd)
  } else {
    core.debug(`Container ${image} is already running.`)
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

/**
 * Information about a Docker network.
 */
export type NetworkInfo = {
  DNSNames: string[]
}

/**
 * Information about a Docker container.
 */
export type ContainerInfo = {
  Id: string
  NetworkSettings: {
    Networks: {[NetworkName: string]: NetworkInfo}
  }
}

export type ContainerNetworkInfo = {
  NetworkName: string
  DNSNames: string[]
  ContainerInfo: ContainerInfo
}

/**
 * Run docker commands to get container information by matching the DNSNames
 * to the given string.
 *
 * @param matchString The string to match in the container's DNS names.
 * @returns {ContainerNetworkInfo} An object of container information of the container with matching DNS name.
 * @throws {Error} If no container is found with the matching DNS name.
 */
export async function _getContainerInfoByDNSName(
  matchString: string
): Promise<ContainerNetworkInfo> {
  const ids = await _exec(['docker', 'ps', '-q'])
  const idList = ids.stdout
    .trim()
    .split('\n')
    .filter(id => id.length > 0)

  const {stdout} = await _exec(['docker', 'inspect', ...idList])
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const containerInfoList: ContainerInfo[] = JSON.parse(stdout)

  const containerInfoListParsed = containerInfoList.map(containerInfo => {
    return Object.entries(containerInfo.NetworkSettings.Networks).map(
      ([k, v]: [string, NetworkInfo]): ContainerNetworkInfo => ({
        NetworkName: k,
        DNSNames: v.DNSNames,
        ContainerInfo: containerInfo
      })
    )
  })

  for (const containerNetworks of containerInfoListParsed) {
    for (const containerNetworkInfo of containerNetworks) {
      for (const dnsName of containerNetworkInfo.DNSNames) {
        if (dnsName.includes(matchString)) {
          return containerNetworkInfo
        }
      }
    }
  }

  throw new Error(`No container found with DNS name matching: ${matchString}`)
}
