import * as core from '@actions/core';
import { runWordPressPluginTests } from './wordpress-plugin-ci';

/**
 * Main entry point for the GitHub Action
 */
async function run({actionCore = core} = {}): Promise<void> {
  try {
    // Get inputs from action.yml
    const pluginPath = actionCore.getInput('plugin-path', { required: true });
    const phpVersion = actionCore.getInput('php-version') || '8.1';
    const wordpressVersion = actionCore.getInput('wordpress-version') || 'latest';
    const testCommand = actionCore.getInput('test-command') || 'composer test';
    const setupScript = actionCore.getInput('setup-script') || '';
    const usePrebuiltImage = actionCore.getInput('use-prebuilt-image') === 'true';

    actionCore.info(`Starting WordPress Plugin CI for plugin at: ${pluginPath}`);
    actionCore.info(`PHP Version: ${phpVersion}`);
    actionCore.info(`WordPress Version: ${wordpressVersion}`);
    actionCore.info(`Test Command: ${testCommand}`);
    actionCore.info(`Use Pre-built Image: ${usePrebuiltImage}`);

    // Run the WordPress plugin tests
    const result = await runWordPressPluginTests({
      pluginPath,
      phpVersion,
      wordpressVersion,
      testCommand,
      setupScript,
      usePrebuiltImage,
    });

    if (result.success) {
      actionCore.info('✅ WordPress plugin tests completed successfully');
      actionCore.setOutput('status', 'success');
      actionCore.setOutput('test-results', result.output);
    } else {
      actionCore.setFailed(`❌ WordPress plugin tests failed: ${result.error}`);
      actionCore.setOutput('status', 'failure');
      actionCore.setOutput('test-results', result.output);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    actionCore.setFailed(`Action failed with error: ${errorMessage}`);
    actionCore.setOutput('status', 'error');
  }
}

// Execute the action
if (require.main === module) {
  void run();
}

export { run };