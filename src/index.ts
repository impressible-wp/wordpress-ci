import * as core from '@actions/core';
import { runWordPressPluginTests } from './wordpress-plugin-ci';

/**
 * Main entry point for the GitHub Action
 */
async function run(): Promise<void> {
  try {
    // Get inputs from action.yml
    const pluginPath = core.getInput('plugin-path', { required: true });
    const phpVersion = core.getInput('php-version') || '8.1';
    const wordpressVersion = core.getInput('wordpress-version') || 'latest';
    const testCommand = core.getInput('test-command') || 'composer test';
    const setupScript = core.getInput('setup-script') || '';
    
    core.info(`Starting WordPress Plugin CI for plugin at: ${pluginPath}`);
    core.info(`PHP Version: ${phpVersion}`);
    core.info(`WordPress Version: ${wordpressVersion}`);
    core.info(`Test Command: ${testCommand}`);

    // Run the WordPress plugin tests
    const result = await runWordPressPluginTests({
      pluginPath,
      phpVersion,
      wordpressVersion,
      testCommand,
      setupScript,
    });

    if (result.success) {
      core.info('✅ WordPress plugin tests completed successfully');
      core.setOutput('status', 'success');
      core.setOutput('test-results', result.output);
    } else {
      core.setFailed(`❌ WordPress plugin tests failed: ${result.error}`);
      core.setOutput('status', 'failure');
      core.setOutput('test-results', result.output);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed with error: ${errorMessage}`);
    core.setOutput('status', 'error');
  }
}

// Execute the action
if (require.main === module) {
  void run();
}

export { run };