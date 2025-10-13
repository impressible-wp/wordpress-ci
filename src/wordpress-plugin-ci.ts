import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';

export interface PluginTestConfig {
  pluginPath: string;
  phpVersion: string;
  wordpressVersion: string;
  testCommand: string;
  setupScript?: string;
  usePrebuiltImage?: boolean;
}

export interface TestResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Validates that the plugin directory exists and contains expected files
 */
function validatePluginDirectory(pluginPath: string): void {
  if (!fs.existsSync(pluginPath)) {
    throw new Error(`Plugin directory does not exist: ${pluginPath}`);
  }

  const composerFile = path.join(pluginPath, 'composer.json');
  const mainPluginFile = fs.readdirSync(pluginPath).find((file: string) => file.endsWith('.php'));

  if (!fs.existsSync(composerFile)) {
    core.warning('No composer.json found in plugin directory');
  }

  if (!mainPluginFile) {
    core.warning('No PHP files found in plugin directory');
  }

  core.info(`✅ Plugin directory validated: ${pluginPath}`);
}

/**
 * Pulls the pre-built Docker image for the WordPress testing environment
 */
async function pullDockerImage(config: PluginTestConfig): Promise<void> {
  core.info('📥 Pulling WordPress testing environment...');
  
  const imageTag = `ghcr.io/impressible-wp/wordpress-plugin-ci:php${config.phpVersion}-latest`;
  
  const pullArgs = [
    'pull',
    imageTag
  ];

  try {
    await exec.exec('docker', pullArgs, {
      cwd: process.cwd(),
      env: { ...process.env } as Record<string, string>,
    });

    // Tag the pulled image as wp-plugin-ci for consistency
    const tagArgs = ['tag', imageTag, 'wp-plugin-ci'];
    await exec.exec('docker', tagArgs, {
      cwd: process.cwd(),
      env: { ...process.env } as Record<string, string>,
    });

    core.info('✅ Docker image pulled successfully');
  } catch (error) {
    core.warning('Failed to pull pre-built image, falling back to local build');
    await buildDockerImage(config);
  }
}

/**
 * Builds the Docker image for the WordPress testing environment
 */
async function buildDockerImage(config: PluginTestConfig): Promise<void> {
  core.info('🔨 Building WordPress testing environment...');
  
  const buildArgs = [
    'build',
    '-t', 'wp-plugin-ci',
    '--build-arg', `PHP_VERSION=${config.phpVersion}`,
    '--build-arg', `WP_VERSION=${config.wordpressVersion}`,
    '.'
  ];

  await exec.exec('docker', buildArgs, {
    cwd: process.cwd(),
    env: { ...process.env } as Record<string, string>,
  });

  core.info('✅ Docker image built successfully');
}

/**
 * Runs the setup script if provided
 */
async function runSetupScript(config: PluginTestConfig): Promise<void> {
  if (!config.setupScript?.trim()) {
    return;
  }

  core.info('🔧 Running setup script...');
  
  const runArgs = [
    'run', '--rm',
    '-v', `${path.resolve(config.pluginPath)}:/workspace/plugin`,
    'wp-plugin-ci',
    'bash', '-c', config.setupScript
  ];

  await exec.exec('docker', runArgs, {
    cwd: process.cwd(),
    env: { ...process.env } as Record<string, string>,
  });

  core.info('✅ Setup script completed');
}

/**
 * Runs the test command in the Docker container
 */
async function runTests(config: PluginTestConfig): Promise<string> {
  core.info('🧪 Running WordPress plugin tests...');
  
  const runArgs = [
    'run', '--rm',
    '-v', `${path.resolve(config.pluginPath)}:/workspace/plugin`,
    '-w', '/workspace/plugin',
    'wp-plugin-ci',
    'bash', '-c', config.testCommand
  ];

  let output = '';
  
  await exec.exec('docker', runArgs, {
    cwd: process.cwd(),
    env: { ...process.env } as Record<string, string>,
    listeners: {
      stdout: (data: Buffer) => {
        const text = data.toString();
        output += text;
        core.info(text);
      },
      stderr: (data: Buffer) => {
        const text = data.toString();
        output += text;
        core.warning(text);
      },
    },
  });

  return output;
}

/**
 * Main function to run WordPress plugin tests
 */
export async function runWordPressPluginTests(config: PluginTestConfig): Promise<TestResult> {
  try {
    // Validate inputs
    validatePluginDirectory(config.pluginPath);
    
    // Pull or build Docker image based on configuration
    if (config.usePrebuiltImage !== false) {
      await pullDockerImage(config);
    } else {
      await buildDockerImage(config);
    }
    
    // Run setup script if provided
    await runSetupScript(config);
    
    // Run tests
    const output = await runTests(config);
    
    return {
      success: true,
      output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(`WordPress plugin tests failed: ${errorMessage}`);
    
    return {
      success: false,
      output: '',
      error: errorMessage,
    };
  }
}