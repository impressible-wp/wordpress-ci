# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v1.0.3] - 2025-10-22

### Changed

- Apache mod_rewrite module enabled in Docker container for better WordPress compatibility
- Enhanced WordPress environment to support URL rewriting for improved compatibility with plugins and themes

## [v1.0.2] - 2025-10-21

### Added

- Disclaimer about the use of WordPress name in README

### Fixed

- README documentation compliance and clarity

## [v1.0.1] - 2025-10-20

### Fixed

- Usage examples in README.md documentation
- Corrected action configuration examples

## [v1.0.0] - 2025-10-20

### Added

- **Initial stable release** of WordPress CI GitHub Action
- Complete GitHub Action for WordPress plugin and theme testing
- Docker-based WordPress environment with configurable options
- Support for plugin testing with Codeception acceptance tests
- Support for theme testing with Codeception acceptance tests
- Combined testing capabilities for both plugins and themes
- SQL import functionality for database setup
- Network name resolution for container communication
- Comprehensive documentation and examples
- Contributing guidelines for developers

### Features

- **Container Management**
  - Automatic WordPress container startup and shutdown
  - Configurable Docker registry, image name, and tag
  - Custom network support for container isolation
  - Database configuration through environment variables
  - Container health checking and logging

- **Testing Support**
  - Plugin volume mounting for development workflow
  - Theme volume mounting for development workflow
  - SQL file import for database seeding
  - Test command execution within container environment
  - Proxy script installation for container command execution

- **Action Inputs**
  - `registry`: Docker container registry (default: docker.io)
  - `image-name`: WordPress image name
  - `image-tag`: WordPress image tag
  - `network`: Docker network for container communication
  - `plugins`: Plugin paths for mounting (newline-separated)
  - `themes`: Theme paths for mounting (newline-separated)
  - `db-host`: Database host configuration
  - `db-name`: Database name configuration
  - `db-user`: Database user configuration
  - `db-password`: Database password configuration
  - `test-command`: Command to execute for testing
  - `test-command-context`: Working directory for test execution
  - `import-sql`: SQL file path for database import

- **Action Outputs**
  - `stdout`: Standard output from test command execution
  - `stderr`: Standard error from test command execution
  - `time`: Execution time in milliseconds

- **Examples and Documentation**
  - Plugin testing example with myplugin
  - Theme testing example with mytheme
  - Combined testing example for multiple components
  - SQL import testing example
  - Comprehensive README documentation
  - Docker container documentation

### Technical Implementation

- TypeScript codebase with full type safety
- ESLint and Prettier integration for code quality
- Jest testing framework with comprehensive test coverage
- GitHub Actions workflows for CI/CD
- Docker multi-stage builds for optimized images
- Pre-commit hooks for code quality enforcement

### Infrastructure

- Automated testing with GitHub Actions
- Docker image publishing to registry
- Version tagging and release management
- Development environment setup with docker-compose

## [Initial] - 2025-10-16

### Added

- Basic Docker container setup for WordPress
- Initial project structure and configuration
- Basic WordPress installation in container
- Docker Compose configuration for local development

[unreleased]: https://github.com/impressible-wp/wordpress-ci/compare/v1.0.3...HEAD
[v1.0.3]: https://github.com/impressible-wp/wordpress-ci/compare/v1.0.2...v1.0.3
[v1.0.2]: https://github.com/impressible-wp/wordpress-ci/compare/v1.0.1...v1.0.2
[v1.0.1]: https://github.com/impressible-wp/wordpress-ci/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/impressible-wp/wordpress-ci/compare/3fb0356...v1.0.0
[initial]: https://github.com/impressible-wp/wordpress-ci/commit/3fb0356
