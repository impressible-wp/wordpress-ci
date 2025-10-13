import { run } from '../index';
import * as core from '@actions/core';
import { runWordPressPluginTests } from '../wordpress-plugin-ci';

// Mock the dependencies
jest.mock('@actions/core');
jest.mock('../wordpress-plugin-ci');

const mockCore = core as jest.Mocked<typeof core>;
const mockRunWordPressPluginTests = runWordPressPluginTests as jest.MockedFunction<
  typeof runWordPressPluginTests
>;

describe('GitHub Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    mockCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'plugin-path': './test-plugin',
        'php-version': '8.1',
        'wordpress-version': 'latest',
        'test-command': 'composer test',
        'setup-script': '',
      };
      return inputs[name] || '';
    });
  });

  it('should run successfully with valid inputs', async () => {
    mockRunWordPressPluginTests.mockResolvedValue({
      success: true,
      output: 'All tests passed!',
    });

    await run();

    expect(mockCore.info).toHaveBeenCalledWith(
      'Starting WordPress Plugin CI for plugin at: ./test-plugin'
    );
    expect(mockCore.info).toHaveBeenCalledWith('✅ WordPress plugin tests completed successfully');
    expect(mockCore.setOutput).toHaveBeenCalledWith('status', 'success');
    expect(mockCore.setOutput).toHaveBeenCalledWith('test-results', 'All tests passed!');
  });

  it('should handle test failures', async () => {
    mockRunWordPressPluginTests.mockResolvedValue({
      success: false,
      output: 'Test output',
      error: 'Tests failed',
    });

    await run();

    expect(mockCore.setFailed).toHaveBeenCalledWith(
      '❌ WordPress plugin tests failed: Tests failed'
    );
    expect(mockCore.setOutput).toHaveBeenCalledWith('status', 'failure');
    expect(mockCore.setOutput).toHaveBeenCalledWith('test-results', 'Test output');
  });

  it('should handle exceptions', async () => {
    mockRunWordPressPluginTests.mockRejectedValue(new Error('Unexpected error'));

    await run();

    expect(mockCore.setFailed).toHaveBeenCalledWith('Action failed with error: Unexpected error');
    expect(mockCore.setOutput).toHaveBeenCalledWith('status', 'error');
  });

  it('should use custom inputs when provided', async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'plugin-path': './custom-plugin',
        'php-version': '8.2',
        'wordpress-version': '6.4',
        'test-command': 'npm test',
        'setup-script': 'npm install',
      };
      return inputs[name] || '';
    });

    mockRunWordPressPluginTests.mockResolvedValue({
      success: true,
      output: 'Tests completed',
    });

    await run();

    expect(mockRunWordPressPluginTests).toHaveBeenCalledWith({
      pluginPath: './custom-plugin',
      phpVersion: '8.2',
      wordpressVersion: '6.4',
      testCommand: 'npm test',
      setupScript: 'npm install',
    });
  });
});
