# WordPress CI

A GitHub Action for WordPress plugin or theme continuous integration, testing, and deployment.

Disclaimer: This is a community project. This is NOT, in anyway, affliated to or endorsed by
[Wordpress.com](Wordpress.com).

## Usage

Assuming you know how to write automatic browser testing, Wordpress CI will ease your pain in
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

            # Running "server-side" commands in the Wordpress CI container
            wpci-cmd wp rewrite structure '/%postname%/'
            wpci-cmd wp plugin activate myplugin

            # Some plugin might uses wp_rewrite and need to regenerate
            # .htaccess to properly work.
            wpci-cmd wp rewrite flush --hard

            # Your test may access the Wordpress CI's URL with this environment
            # variable
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
