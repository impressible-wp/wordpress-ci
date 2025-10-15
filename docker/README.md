# WordPress CI's Container Image

This folder includes [config file](Dockerfile) to build a standardized Wordpress environment
for CI testing.

## Usage

To run a proper environment, you must start and provide a MySQL or compatible server. And then
you must provide a valid host, user and password with environment variables:

- `WORDPRESS_DB_HOST`: The hostname of database server to use.
- `WORDPRESS_DB_NAME`: The database name to connect to.
- `WORDPRESS_DB_USER`: The database username for login.
- `WORDPRESS_DB_PASSWORD`: The database password for login.

And then you may start the container.

The container will start an Apache server that runs a copy of Wordpress installed here:

- `/var/www/html`

The working directory of the image is:

- `/var/www/html/wp-content`

You may map folders for your plugin(s) / theme(s) and then do proper integration test or acceptance
test.

## Software Installed

Besides the Wordpress source code, the docker image pre-installed the below CLI tools for the ease
of development.

- [wp](https://wp-cli.org/): Wordpress's wp-cli.
- [composer](https://getcomposer.org): Composer package manager.

## Environment Variables

When run, docker container allow user to [inject environment variables](https://docs.docker.com/reference/cli/docker/container/run/#env).

Other than the variables supported by the default [PHP image](https://hub.docker.com/_/php),
the docker build from this [Dockerfile](Dockerfile) support a few variables for configuring the
unattained Wordpress installation:

### For Database Connection

- `WORDPRESS_DB_HOST`: The hostname of database server to use (default: "mysql").
- `WORDPRESS_DB_NAME`: The database name to connect to use (default: "wordpress").
- `WORDPRESS_DB_USER`: The database username for login (default: "username").
- `WORDPRESS_DB_PASSWORD`: The database password for login (default: "password").
- `WORDPRESS_DB_CHARSET`: The database character set to use (default: "utf8mb4").
- `WORDPRESS_DB_COLLATE`: The database collate type (default: "").

(See: [wp-config-docker.php](wp-config-docker.php))

### For Unattended Wordpress Setup

- `WORDPRESS_TITLE`: The site title (default: "WordpressCI").
- `WORDPRESS_ADMIN_USER`: The admin user's username (default: "admin").
- `WORDPRESS_ADMIN_PASSWORD`: The admin user password (default: "password").
- `WORDPRESS_ADMIN_EMAIL`: The admin user's email address (default: "user@example.com").

# License

This software is licensed under the [MIT License](https://mit-license.org). A copy of the license
is distributed along with the source code [here](../LICENSE.md).
