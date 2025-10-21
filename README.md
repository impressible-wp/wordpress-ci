# WordPress CI

A GitHub Action for WordPress plugin or theme continuous integration, testing, and deployment.

Disclaimer: This is a community project. This is NOT, in anyway, affliated to or endorsed by
[Wordpress.com](Wordpress.com).

## Usage

Assuming you know how to write automatic browser testing, Wordpress CI will ease your pain in
setting up CI/CD environment to run your browser testing against different PHP versions.

In your project repository, add a Workfow file (e.g. `.github/workflows/acceptance-test.yml`):

```yaml
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

## Docker Container

This repository includes [config file](docker/Dockerfile) to build the environment for
CI testing. You may check README.md in [the folder](docker/) for more information.

## Contributing

If you'd like to contribute to this project (issue report, pull request, etc), please check out
our [Contributing document](CONTRIBUTING.md). Thanks.

## License

This software is licensed under the [MIT License](https://mit-license.org). A copy of the license
is distributed along with the source code [here](LICENSE.md).
