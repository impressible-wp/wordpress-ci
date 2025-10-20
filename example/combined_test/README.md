# Combined Test Example

This folder only run acceptance test against Wordpress CI environment that mapped "myplugin"
and "mytheme" to it.

## Key Concepts

- Acceptance test are run against the Wordpress installation in the Wordpress CI container.
  Not the current folder.
- The plugins and themes are mapped into the Wordpress CI container.
- Conceptually, they do not need to be in the same folder or even the same GitHub project.

## GitHub Action Example

This is an example setup for a complicated test with multiple plugins and themes:

```yml
name: Acceptance Test
runs-on: ubuntu-latest
env:
  # The hostname should match the MySQL / MariaDB
  # service name defined below
  DB_HOST: mysql
  DB_NAME: wordpress
  DB_USER: username
  DB_PASSWORD: password
services:
  mysql:
    image: mariadb:12
    env:
      MARIADB_RANDOM_ROOT_PASSWORD: 'yes'
      MARIADB_DATABASE: ${{ env.DB_NAME }}
      MARIADB_USER: ${{ env.DB_USER }}
      MARIADB_PASSWORD: ${{ env.DB_PASSWORD }}
    ports:
      - 3306:3306
jobs:
  test-action:
    name: Test (php-${{ matrix.php-version }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        # test against multiple PHP versions
        php-version: [8.1, 8.2, 8.3, 8.4]

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
          image: ghcr.io/impressible-wp/wordpress-ci:php${{ matrix.php-version }}
          # Change the plugin and theme path to
          # the ones that match location in your repository
          plugins: |
            ./example/myplugin1
            ./example/myplugin2
          themes: |
            ./example/mytheme
            ./example/mychildtheme
          db-host: ${{ env.DB_HOST }}
          db-name: ${{ env.DB_NAME }}
          db-user: ${{ env.DB_USER }}
          db-password: ${{ env.DB_PASSWORD }}
          test-command: |

            # Running "server-side" commands in the Wordpress CI container
            wpci-cmd wp rewrite structure '/%postname%/'
            wpci-cmd wp plugin activate myplugin1 myplugin2
            wpci-cmd wp theme activate mychildtheme

            # You may install other plugins or theme with the proxied wp-cli command
            wpci-cmd wp install polylang
            wpci-cmd wp activate polylang

            # Your test may access the Wordpress CI's URL with this environment variable
            echo "Wordpress is accessible here: $WORDPRESS_CI_URL"

            # Running "client-side" commands in GitHub Actions runner
            composer install
            composer run test
```

## Credentails for the Wordpress Admin User

By default, Wordpress CI container will do an unattended installation of the wordpress with
one admin account:

- Username: admin
- Password: password
- Email: user@example.com

(See: [docker-entrypoint.sh](../../docker/docker-entrypoint.sh))

## Useful Testing Tools

- [Codeception](https://codeception.com/)
- [Webdriver Module of Codeception](https://codeception.com/docs/modules/WebDriver)

### Further Reading

- [Acceptance Test](https://codeception.com/docs/AcceptanceTests)
- [Acceptance Test of This Project](../../.github/workflows/acceptance.yml)
