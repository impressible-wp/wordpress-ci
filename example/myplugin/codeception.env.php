<?php

/**
 * @file codeception.env.php
 *
 * Environment variable loading with default.
 *
 * This is a quick way to work environment variable, with default value,
 * into codeception configurations.
 *
 * To use this, you must add the below code into the top level of
 * codeception.yml:
 *
 * ```yaml
 * params:
 *   - codeception.env.php
 * ```
 *
 * Then in the same codeception.yml, you may use placeholder names to
 * refer to environment variables (e.g. '%WORDPRESS_CI_URL%')
 *
 * @see https://codeception.com/docs/ModulesAndHelpers#dynamic-configuration-with-parameters
 */

return [
    'WORDPRESS_CI_URL' => getenv('WORDPRESS_CI_URL') ?? 'http://localhost:8080',
];
