# Wordpress Plugin CI

This is a project to provide fundation for CI testing any Wordpress plugin


## Docker Container

This repository includes [config file](Dockerfile) to build the environment for
CI testing.
 

### Environment Variables

Other than the variables supported by the default [Wordpress image](https://hub.docker.com/_/wordpress),
the docker build from this [Dockerfile](Dockerfile) support a few variables for configuring the
unattained Wordpress installation:

* `WORDPRESS_TITLE`: The site title.
* `WORDPRESS_ADMIN_USER`: The admin user's username.
* `WORDPRESS_ADMIN_PASSWORD`: The admin user password.
* `WORDPRESS_ADMIN_EMAIL`: The admin user's email address.


## License

This software is licensed under the [MIT License](https://mit-license.org). A copy of the license
is distributed along with the source code [here](LICENSE.md).