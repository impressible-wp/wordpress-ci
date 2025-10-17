# Combined Test Example

This folder only run acceptance test against Wordpress CI environment that mapped "myplugin"
and "mytheme" to it.

## Key Concepts

* Acceptance test are run against the Wordpress installation in the Wordpress CI container.
  Not the current folder.
* The plugins and themes are mapped into the Wordpress CI container.
* Conceptually, they do not need to be in the same folder or even the same GitHub project.
