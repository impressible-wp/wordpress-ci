# WordPress Plugin CI

A GitHub Action that provides a complete CI/CD solution for WordPress plugin testing. This action runs your WordPress plugin tests in a pre-configured environment with WordPress, PHP, and all necessary testing tools.

## Features

- 🐘 **Multiple PHP versions** - Test with PHP 8.1, 8.2, 8.3, 8.4
- 🔧 **WordPress versions** - Test against different WordPress versions
- 🛠️ **Pre-installed tools** - Includes WP-CLI, Composer, PHPUnit, and more
- 🐳 **Dockerized environment** - Consistent testing environment
- 📊 **Test reporting** - Detailed test output and status reporting
- ⚡ **Fast setup** - Pre-built Docker images for quick CI runs
- 🏷️ **Tagged images** - Individual images for each PHP version

## Quick Start

Add this action to your WordPress plugin repository's `.github/workflows/test.yml`:

```yaml
name: Test Plugin

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php-version: ['8.1', '8.2', '8.3', '8.4']
        wordpress-version: ['6.3', '6.4', 'latest']
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Test WordPress Plugin
        uses: impressible-wp/wordpress-plugin-ci@v1
        with:
          plugin-path: '.'
          php-version: ${{ matrix.php-version }}
          wordpress-version: ${{ matrix.wordpress-version }}
          test-command: 'composer test'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `plugin-path` | Path to the WordPress plugin directory | ✅ | `.` |
| `php-version` | PHP version to use for testing | ❌ | `8.1` |
| `wordpress-version` | WordPress version to use | ❌ | `latest` |
| `test-command` | Command to run the tests | ❌ | `composer test` |
| `setup-script` | Optional setup script to run before tests | ❌ | `` |
| `use-prebuilt-image` | Use pre-built Docker image instead of building locally | ❌ | `true` |

## Outputs

| Output | Description |
|--------|-------------|
| `status` | Test execution status (`success`, `failure`, `error`) |
| `test-results` | Output from the test execution |

## Usage Examples

### Basic Usage

```yaml
- name: Test Plugin
  uses: impressible-wp/wordpress-plugin-ci@v1
  with:
    plugin-path: './my-plugin'
```

### Advanced Configuration

```yaml
- name: Test Plugin with Setup
  uses: impressible-wp/wordpress-plugin-ci@v1
  with:
    plugin-path: './my-plugin'
    php-version: '8.2'
    wordpress-version: '6.4'
    setup-script: |
      composer install --no-dev
      npm install && npm run build
    test-command: |
      composer run-script test:unit
      composer run-script test:integration
```

### Matrix Testing

```yaml
strategy:
  matrix:
    php: ['8.1', '8.2', '8.3', '8.4']
    wordpress: ['6.2', '6.3', '6.4']
    
steps:
  - name: Test Plugin Matrix
    uses: impressible-wp/wordpress-plugin-ci@v1
    with:
      php-version: ${{ matrix.php }}
      wordpress-version: ${{ matrix.wordpress }}
```

## Available Docker Images

The action automatically uses pre-built Docker images hosted on GitHub Container Registry. Available tags:

- `ghcr.io/impressible-wp/wordpress-plugin-ci:php8.1-latest`
- `ghcr.io/impressible-wp/wordpress-plugin-ci:php8.2-latest`
- `ghcr.io/impressible-wp/wordpress-plugin-ci:php8.3-latest`
- `ghcr.io/impressible-wp/wordpress-plugin-ci:php8.4-latest`
- `ghcr.io/impressible-wp/wordpress-plugin-ci:latest` (manifest pointing to all PHP versions)

You can also use specific version tags:
- `ghcr.io/impressible-wp/wordpress-plugin-ci:v1.0.0-php8.1`
- `ghcr.io/impressible-wp/wordpress-plugin-ci:main-php8.2`

### Using Local Docker Build

If you prefer to build the Docker image locally instead of using pre-built images:

```yaml
- name: Test with Local Build
  uses: impressible-wp/wordpress-plugin-ci@v1
  with:
    use-prebuilt-image: false
    php-version: '8.1'
```

## Docker Container

This repository includes a [Docker configuration](docker/Dockerfile) to build the testing environment.

### Software Included

Besides WordPress source code, the Docker image includes these pre-installed tools:

* **[WP-CLI](https://wp-cli.org/)** - WordPress command line interface
* **[Composer](https://getcomposer.org)** - PHP dependency manager  
* **[PHPUnit](https://phpunit.de/)** - PHP testing framework
* **[Node.js & npm](https://nodejs.org/)** - For JavaScript build tools
* **[Git](https://git-scm.com/)** - Version control system

### Environment Variables

The Docker container supports all variables from the [official WordPress image](https://hub.docker.com/_/wordpress), plus these additional configuration options:

| Variable | Description | Default |
|----------|-------------|---------|
| `WORDPRESS_TITLE` | Site title | `Test Site` |
| `WORDPRESS_ADMIN_USER` | Admin username | `admin` |
| `WORDPRESS_ADMIN_PASSWORD` | Admin password | `password` |
| `WORDPRESS_ADMIN_EMAIL` | Admin email | `admin@example.com` |

## Plugin Requirements

Your WordPress plugin should include:

### Composer Configuration

Create a `composer.json` with test scripts:

```json
{
  "name": "your-vendor/your-plugin",
  "require-dev": {
    "phpunit/phpunit": "^9.0",
    "wp-coding-standards/wpcs": "*"
  },
  "scripts": {
    "test": "phpunit",
    "test:unit": "phpunit --testsuite=unit",
    "test:integration": "phpunit --testsuite=integration",
    "lint": "phpcs --standard=WordPress src/"
  }
}
```

### PHPUnit Configuration

Create `phpunit.xml`:

```xml
<?xml version="1.0"?>
<phpunit
    bootstrap="tests/bootstrap.php"
    backupGlobals="false"
    colors="true"
    convertErrorsToExceptions="true"
    convertNoticesToExceptions="true"
    convertWarningsToExceptions="true">
    
    <testsuites>
        <testsuite name="unit">
            <directory prefix="test-" suffix=".php">./tests/unit/</directory>
        </testsuite>
        <testsuite name="integration">
            <directory prefix="test-" suffix=".php">./tests/integration/</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

## Development

### Building the Action

```bash
# Install dependencies
npm install

# Build the action
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Running Locally

```bash
# Build Docker image
docker build -t wp-plugin-ci ./docker

# Test a plugin
docker run --rm \
  -v $(pwd)/my-plugin:/workspace/plugin \
  -w /workspace/plugin \
  wp-plugin-ci \
  composer test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This software is licensed under the [MIT License](https://mit-license.org). See [LICENSE.md](LICENSE.md) for details.
