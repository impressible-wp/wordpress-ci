<?php

/**
 * This file tests against rewrite rules used in "myplugin" example plugin.
 * This file is purely for testing the result.
 */

// Derive the URL from environment variable
$wordpress_ci_url = getenv("WORDPRESS_CI_URL");
$url = "{$wordpress_ci_url}/custom-content/";

// Fetching
echo "Fetching $url\n";
$input = file_get_contents($url);
$data = json_decode($input, true, JSON_THROW_ON_ERROR);
echo "Response: " . $input . "\n\n";

// Ensure response header is in the environment.
// After PHP 8.5, this function is available and preferred.
$response_header = function_exists("http_get_last_response_headers")
  ? http_get_last_response_headers()
  : $http_response_header;

/**
 * Print error message with proper ANSI highlight and then exit
 * with code 1.
 *
 * @param mixed $string
 * @return never
 */
function print_error_and_exit($string) {
  // Use Red font (ANSI escape code).
  echo "\e[31m{$string}\e[0m\n";
  exit(1);
}

/**
 * Print success message with proper ANSI highlight
 *
 * @param mixed $string
 * @return void
 */
function print_success($string, $green_background = false) {
  if ($green_background) {
    // Use Green background (ANSI escape code).
    echo "\e[42m{$string}\e[0m\n";
    return;
  }
  // Use Green font (ANSI escape code).
  echo "\e[32m{$string}\e[0m\n";
}

// Check response header
if (!isset($response_header)) {
  print_error_and_exit("Response header is not set in the environment.");
}

if (!in_array("Content-Type: application/json", $response_header, true)) {
  print_error_and_exit("Content-Type header is incorrect.");
} else {
  print_success("Content-Type header is correct.");
}

// Check JSON content
if (!is_array($data)) {
  print_error_and_exit("Response is not a valid JSON object.");
} else {
  print_success("Response is a valid JSON object.");
}
$expected = ['message' => 'Hello from My Plugin!'];
if ($data !== $expected) {
  echo "Expected: " . var_export($expected, true) . "\n";
  echo "Got: " . var_export($data, true) . "\n";
  print_error_and_exit("Response JSON content is incorrect.");
} else {
  print_success("Response JSON content is correct.");
}

// Echo "All tests passed!" if everything is correct.
// Highlighted in green color (ANSI escape code).
print_success("All tests passed!", green_background: true);
