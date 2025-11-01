# WordPress CI

A GitHub Action for WordPress plugin or theme continuous integration, testing, and deployment.

Disclaimer: This is a community project. This is NOT, in anyway, affliated to or endorsed by
[WordPress.com](https://wordpress.com).

## Usage

Assuming you know how to write automatic browser testing, WordPress CI will ease your pain in
setting up CI/CD environment to run your browser testing against different PHP versions.

In your project repository, add a Workfow file (e.g. `.github/workflows/acceptance-test.yml`):

```yaml
name: CI Test

on:
  pull_request:
    branches: [main]

jobs:
  test-action:
    name: Acceptance Test
    services:
      # The default database service name (hostname) for wordpress-ci is "mysql"
      # You can change it by setting the "db-host" input to the action.
      mysql:
        image: mariadb:12
        env:
          MARIADB_RANDOM_ROOT_PASSWORD: 'yes'
          # These are the database credentials used by wordpress-ci
          MARIADB_DATABASE: wordpress
          MARIADB_USER: username
          MARIADB_PASSWORD: password
        ports:
          # Simply for easier debug, not needed for wordpress-ci to work
          - 3306:3306
    steps:
      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Setup Chrome for webdriver-based testing
        uses: browser-actions/setup-chrome@v2

      - name: Setup Chrome Driver for webdriver-based testing
        uses: nanasess/setup-chromedriver@v2

      - name: Start Chrome Driver process in background
        run: chromedriver --port=4444 >chromedriver.log 2>&1 &

      - name: Test
        uses: impressible-wp/wordpress-ci@v1
        with:
          # This folder will be binded to "wordpress-ci" container
          # /var/www/html/wp-content/plugins/myplugin
          plugins: ./example/myplugin

          # Where in your repository do you want to start the test.
          # Depends on where you test scripts are.
          test-context: ./example/myplugin

          test-command: |

            # Running "server-side" commands in the WordPress CI container
            wpci-cmd wp rewrite structure '/%postname%/'
            wpci-cmd wp plugin activate myplugin

            # Some plugin might uses wp_rewrite and need to regenerate
            # .htaccess to properly work.
            wpci-cmd wp rewrite flush --hard

            # Your test may access the WordPress CI's URL with this environment
            # variable
            echo "WordPress is accessible here: $WORDPRESS_CI_URL"

            # Running "client-side" commands in GitHub Actions runner
            composer install
            composer run test
```

### Matrix testing

WordPress CI default builds for PHP version 8.1+. Each has its own different image
ready to be pull from.

```yaml
jobs:
  build:
    name: PHP ${{ matrix.php-version }} Ttest
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php-version: ['8.1', '8.2', '8.3', '8.4']
    steps:
      - uses: actions/checkout@v5

        ...

      - name: Test
        uses: impressible-wp/wordpress-ci@v1
        with:
          image: ghcr.io/impressible-wp/wordpress-ci:php${{ matrix.php-version }}
          ...
```

### Inputs

| Input                  | Required | Default                                      | Description                                                                                                                                                                                             |
| ---------------------- | -------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `image`                | No       | `ghcr.io/impressible-wp/wordpress-ci:latest` | The Docker container image to use for the WordPress CI environment. For specific PHP versions, use `ghcr.io/impressible-wp/wordpress-ci:php8.1`, `php8.2`, `php8.3`, or `php8.4`                        |
| `network`              | No       | _(auto-detected)_                            | The Docker network to use. Must match the network of your database container. If empty, the action will automatically detect the network by finding the database container by the hostname in `db-host` |
| `plugins`              | No       | _(none)_                                     | List of plugin directories to mount into WordPress, one per line. Each directory will be mounted to `/var/www/html/wp-content/plugins/[basename]`                                                       |
| `themes`               | No       | _(none)_                                     | List of theme directories to mount into WordPress, one per line. Each directory will be mounted to `/var/www/html/wp-content/themes/[basename]`                                                         |
| `db-host`              | No       | `mysql`                                      | The hostname of the MySQL/MariaDB service container. Should match your GitHub Actions service name                                                                                                      |
| `db-name`              | No       | `wordpress`                                  | The name of the database to use for WordPress installation                                                                                                                                              |
| `db-user`              | No       | `username`                                   | The database user to connect as                                                                                                                                                                         |
| `db-password`          | No       | `password`                                   | The password for the database user                                                                                                                                                                      |
| `clean-on-start`       | No       | `true`                                       | Whether to clean the WordPress installation on start. Accepts `true`, `yes`, `1` for true; any other value for false                                                                                    |
| `import-sql`           | No       | _(none)_                                     | Path to an SQL file to import into the database. **Note:** This will skip the unattended WordPress installation                                                                                         |
| `test-command`         | **Yes**  | `echo "No test command specified"`           | Command(s) to execute for testing. Can be multi-line. Use `wpci-cmd` prefix to run commands inside the WordPress container                                                                              |
| `test-command-context` | No       | `.`                                          | Directory to run the test command in, relative to your repository root                                                                                                                                  |

#### Usage Examples

**Plugin Testing:**

```yaml
with:
  plugins: |
    ./my-plugin
    ./another-plugin
  test-command: |
    wpci-cmd wp plugin activate my-plugin
    composer install
    composer run test
```

**Theme Testing:**

```yaml
with:
  themes: ./my-theme
  test-command: |
    wpci-cmd wp theme activate my-theme
    npm install
    npm run test
```

**Custom Database Setup:**

```yaml
services:
  database:
    image: mysql:8.0
    env:
      MYSQL_DATABASE: my_wp_db
      MYSQL_USER: wp_user
      MYSQL_PASSWORD: wp_password
      MYSQL_ROOT_PASSWORD: root_password

with:
  db-host: database
  db-name: my_wp_db
  db-user: wp_user
  db-password: wp_password
```

**SQL Import:**

```yaml
with:
  import-sql: ./tests/fixtures/sample-data.sql
  clean-on-start: false
  test-command: |
    wpci-cmd wp user list
    composer run test
```

## Docker Container

This repository includes [config file](docker/Dockerfile) to build the environment for
CI testing. You may check README.md in [the folder](docker/) for more information.

## Contributing

If you'd like to contribute to this project (issue report, pull request, etc), please check out
our [Contributing document](CONTRIBUTING.md). Thanks.

## License

This software is licensed under the [MIT License](https://mit-license.org). A copy of the license
is distributed along with the source code [here](LICENSE.md).
