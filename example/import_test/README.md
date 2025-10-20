# Database Import Test Example

Sometimes, you have a setup that is very complicated to replicate. It can be simpler to
simply import your whole SQL dump into the testing envrionment before testing.

This folder shows how to use `import-sql` input to do so.

## Key Concepts

- Acceptance test are run against the Wordpress installation in the Wordpress CI container.
  Not the current folder.
- The plugins and themes are mapped into the Wordpress CI container.
- Conceptually, they do not need to be in the same folder or even the same GitHub project.

## GitHub Action Example

This is an example setup for a testing with one plugin:

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
    name: Example Action
    runs-on: ubuntu-latest
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
          # Change the plugin and theme path to
          # the ones that match location in your repository
          plugins: ./example/myplugin
          db-host: ${{ env.DB_HOST }}
          db-name: ${{ env.DB_NAME }}
          db-user: ${{ env.DB_USER }}
          db-password: ${{ env.DB_PASSWORD }}

          # Use database file path in your repostory
          import-sql: mydump.sql

          # Actual test
          test-command: |

            # Running "server-side" commands in the Wordpress CI container
            wpci-cmd wp rewrite structure '/%postname%/'
            wpci-cmd wp plugin activate myplugin

            # Your test may access the Wordpress CI's URL with this environment variable
            echo "Wordpress is accessible here: $WORDPRESS_CI_URL"

            # Running "client-side" commands in GitHub Actions runner
            composer install
            composer run test
```

## Credentails for the Wordpress Admin User

With `import-sql` setup propertly, the Wordpress CI container will no longer run the
unattended installation steps. And the default username and password of the installed
Wordpress might be different (depends on your SQL dump content).

See: [docker-entrypoint.sh](../../docker/docker-entrypoint.sh)

## Useful Testing Tools

- [Codeception](https://codeception.com/)
- [Webdriver Module of Codeception](https://codeception.com/docs/modules/WebDriver)

### Further Reading

- [Acceptance Test](https://codeception.com/docs/AcceptanceTests)
- [Acceptance Test of This Project](../../.github/workflows/acceptance.yml)
