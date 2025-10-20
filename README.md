# WordPress CI

A GitHub Action for WordPress plugin or theme continuous integration, testing, and deployment.

## Usage

```yaml
- uses: shogo82148/actions-setup-mysql@v1
  with:
    mysql-version: mariadb-11.7
    user: username
    password: password
- name: Create database
  run: |
    mysql -uroot -e 'CREATE DATABASE wordpress'
    mysql -uroot -e 'GRANT ALL ON wordpress to username'
- uses: impressible-wp/wordpress-ci@v1
  with:
    myInput: 'your-value'
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
