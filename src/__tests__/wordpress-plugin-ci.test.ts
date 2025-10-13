import * as core from '@actions/core';
import * as exec from '@actions/exec';

// Mock the dependencies before importing
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@actions/exec', () => ({
  exec: jest.fn(),
}));

// Mock fs and path after mocking the actions
const mockExistsSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockJoin = jest.fn();
const mockResolve = jest.fn();

jest.doMock('fs', () => ({
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
}));

jest.doMock('path', () => ({
  join: mockJoin,
  resolve: mockResolve,
}));

// Now import the module after mocking
import { runWordPressPluginTests, PluginTestConfig } from '../wordpress-plugin-ci';

const mockCore = core as jest.Mocked<typeof core>;
const mockExec = exec as jest.Mocked<typeof exec>;

// Mock process.cwd and process.env
const mockProcess = {
  cwd: jest.fn(() => '/mock/cwd'),
  env: { NODE_ENV: 'test' },
};
Object.defineProperty(global, 'process', {
  value: mockProcess,
});

describe('WordPress Plugin CI', () => {
  let defaultConfig: PluginTestConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    defaultConfig = {
      pluginPath: './test-plugin',
      phpVersion: '8.1',
      wordpressVersion: 'latest',
      testCommand: 'composer test',
      setupScript: '',
      usePrebuiltImage: true,
    };

    // Setup default mocks
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['test-plugin.php', 'composer.json'] as any);
    mockJoin.mockImplementation((...args: string[]) => args.join('/'));
    mockResolve.mockImplementation((...args: string[]) => '/' + args.join('/'));
    mockExec.exec.mockResolvedValue(0);
  });

  describe('runWordPressPluginTests', () => {
    it('should successfully run tests with pre-built image', async () => {
      const result = await runWordPressPluginTests(defaultConfig);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.error).toBeUndefined();
      
      // Verify directory validation
      expect(mockExistsSync).toHaveBeenCalledWith('./test-plugin');
      expect(mockReaddirSync).toHaveBeenCalledWith('./test-plugin');
      
      // Verify Docker image pull
      expect(mockExec.exec).toHaveBeenCalledWith('docker', [
        'pull',
        'ghcr.io/impressible-wp/wordpress-plugin-ci:php8.1-latest'
      ], expect.any(Object));
      
      // Verify Docker tag
      expect(mockExec.exec).toHaveBeenCalledWith('docker', [
        'tag',
        'ghcr.io/impressible-wp/wordpress-plugin-ci:php8.1-latest',
        'wp-plugin-ci'
      ], expect.any(Object));
      
      // Verify test execution
      expect(mockExec.exec).toHaveBeenCalledWith('docker', [
        'run', '--rm',
        '-v', '/./test-plugin:/workspace/plugin',
        '-w', '/workspace/plugin',
        'wp-plugin-ci',
        'bash', '-c', 'composer test'
      ], expect.any(Object));
    });

    it('should use local build when usePrebuiltImage is false', async () => {
      const config = { ...defaultConfig, usePrebuiltImage: false };
      
      const result = await runWordPressPluginTests(config);

      expect(result.success).toBe(true);
      
      // Verify Docker build instead of pull
      expect(mockExec.exec).toHaveBeenCalledWith('docker', [
        'build',
        '-t', 'wp-plugin-ci',
        '--build-arg', 'PHP_VERSION=8.1',
        '--build-arg', 'WP_VERSION=latest',
        '.'
      ], expect.any(Object));
    });

    it('should fall back to local build when pulling image fails', async () => {
      // Mock pull to fail, but build to succeed
      mockExec.exec
        .mockRejectedValueOnce(new Error('Pull failed'))  // Docker pull fails
        .mockResolvedValueOnce(0)                         // Docker build succeeds
        .mockResolvedValueOnce(0);                        // Docker run succeeds

      const result = await runWordPressPluginTests(defaultConfig);

      expect(result.success).toBe(true);
      expect(mockCore.warning).toHaveBeenCalledWith('Failed to pull pre-built image, falling back to local build');
      
      // Verify it tried to pull first, then built
      expect(mockExec.exec).toHaveBeenCalledWith('docker', [
        'pull',
        'ghcr.io/impressible-wp/wordpress-plugin-ci:php8.1-latest'
      ], expect.any(Object));
      
      expect(mockExec.exec).toHaveBeenCalledWith('docker', [
        'build',
        '-t', 'wp-plugin-ci',
        '--build-arg', 'PHP_VERSION=8.1',
        '--build-arg', 'WP_VERSION=latest',
        '.'
      ], expect.any(Object));
    });

    it('should run setup script when provided', async () => {
      const config = { 
        ...defaultConfig, 
        setupScript: 'composer install --no-dev' 
      };
      
      await runWordPressPluginTests(config);

      // Verify setup script execution
      expect(mockExec.exec).toHaveBeenCalledWith('docker', [
        'run', '--rm',
        '-v', '/./test-plugin:/workspace/plugin',
        'wp-plugin-ci',
        'bash', '-c', 'composer install --no-dev'
      ], expect.any(Object));
    });

    it('should skip setup script when empty', async () => {
      const config = { ...defaultConfig, setupScript: '' };
      
      await runWordPressPluginTests(config);

      // Should not call setup script
      const setupCalls = mockExec.exec.mock.calls.filter(call => 
        call[1]?.includes('composer install --no-dev')
      );
      expect(setupCalls).toHaveLength(0);
    });

    it('should skip setup script when whitespace only', async () => {
      const config = { ...defaultConfig, setupScript: '   \n  \t  ' };
      
      await runWordPressPluginTests(config);

      // Should not call setup script
      const setupCalls = mockExec.exec.mock.calls.filter(call => 
        Array.isArray(call[1]) && call[1].some(arg => arg.includes('composer install'))
      );
      expect(setupCalls).toHaveLength(0);
    });

    it('should handle plugin directory validation errors', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await runWordPressPluginTests(defaultConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Plugin directory does not exist: ./test-plugin');
      expect(mockCore.error).toHaveBeenCalledWith(
        'WordPress plugin tests failed: Plugin directory does not exist: ./test-plugin'
      );
    });

    it('should warn when composer.json is missing', async () => {
      mockExistsSync
        .mockReturnValueOnce(true)   // Plugin directory exists
        .mockReturnValueOnce(false); // composer.json doesn't exist
      mockReaddirSync.mockReturnValue(['test-plugin.php'] as any);

      await runWordPressPluginTests(defaultConfig);

      expect(mockCore.warning).toHaveBeenCalledWith('No composer.json found in plugin directory');
    });

    it('should warn when no PHP files are found', async () => {
      mockReaddirSync.mockReturnValue(['README.md', 'package.json'] as any);

      await runWordPressPluginTests(defaultConfig);

      expect(mockCore.warning).toHaveBeenCalledWith('No PHP files found in plugin directory');
    });

    it('should handle Docker execution errors', async () => {
      mockExec.exec.mockRejectedValue(new Error('Docker command failed'));

      const result = await runWordPressPluginTests(defaultConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Docker command failed');
    });

    it('should capture test output from stdout and stderr', async () => {
      const mockStdout = 'Test output line 1\nTest passed\n';
      const mockStderr = 'Warning: deprecated function\n';
      
      mockExec.exec.mockImplementation((_command, args, options) => {
        // Simulate the test run command (last exec call)
        if (Array.isArray(args) && args.includes('-w')) {
          const listeners = options?.listeners;
          if (listeners) {
            // Simulate stdout output
            listeners.stdout?.(Buffer.from(mockStdout));
            // Simulate stderr output  
            listeners.stderr?.(Buffer.from(mockStderr));
          }
        }
        return Promise.resolve(0);
      });

      const result = await runWordPressPluginTests(defaultConfig);

      expect(result.success).toBe(true);
      expect(result.output).toBe(mockStdout + mockStderr);
      expect(mockCore.info).toHaveBeenCalledWith(mockStdout);
      expect(mockCore.warning).toHaveBeenCalledWith(mockStderr);
    });

    it('should use correct PHP version in image tag', async () => {
      const config = { ...defaultConfig, phpVersion: '8.3' };
      
      await runWordPressPluginTests(config);

      expect(mockExec.exec).toHaveBeenCalledWith('docker', [
        'pull',
        'ghcr.io/impressible-wp/wordpress-plugin-ci:php8.3-latest'
      ], expect.any(Object));
    });

    it('should use correct WordPress version in build args', async () => {
      const config = { 
        ...defaultConfig, 
        usePrebuiltImage: false,
        wordpressVersion: '6.4' 
      };
      
      await runWordPressPluginTests(config);

      expect(mockExec.exec).toHaveBeenCalledWith('docker', [
        'build',
        '-t', 'wp-plugin-ci',
        '--build-arg', 'PHP_VERSION=8.1',
        '--build-arg', 'WP_VERSION=6.4',
        '.'
      ], expect.any(Object));
    });

    it('should handle non-Error exceptions', async () => {
      mockExec.exec.mockRejectedValue('String error');

      const result = await runWordPressPluginTests(defaultConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
    });

    it('should log correct info messages', async () => {
      await runWordPressPluginTests(defaultConfig);

      expect(mockCore.info).toHaveBeenCalledWith('📥 Pulling WordPress testing environment...');
      expect(mockCore.info).toHaveBeenCalledWith('✅ Docker image pulled successfully');
      expect(mockCore.info).toHaveBeenCalledWith('🧪 Running WordPress plugin tests...');
      expect(mockCore.info).toHaveBeenCalledWith('✅ Plugin directory validated: ./test-plugin');
    });

    it('should resolve plugin path correctly', async () => {
      const config = { ...defaultConfig, pluginPath: '../my-plugin' };
      
      await runWordPressPluginTests(config);

      expect(mockResolve).toHaveBeenCalledWith('../my-plugin');
    });
  });
});