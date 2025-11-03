#!/usr/bin/env php
<?php

if (!class_exists(\ZipArchive::class)) {
  throw new \Exception('Setup requires "ext-zip" to be installed and enabled.');
}

// Get GitHub API of assets of the latest releases
$context = stream_context_create([
  'http' => [
    'method' => 'GET',
    'ignore_errors' => true,
    'header' => [
      'User-Agent: PHP',
    ],
  ],
]);
$response = file_get_contents('https://api.github.com/repos/fairpm/fair-plugin/releases/latest', context: $context);
$response_code = substr($http_response_header[0], 9, 3);
if ($response_code !== '200' && $response_code !== 200) {
  echo "$response_code\n";
  exit('error');
}

// Map all assets to their name and download URL
$response_data = json_decode($response, flags: JSON_THROW_ON_ERROR);
$assets_map = array_combine(
  array_map(fn ($asset) => $asset->name, $response_data->assets),
  array_map(
    fn ($asset) => (object) [
      'browser_download_url' => $asset->browser_download_url,
      'type' => match (true) {
        preg_match('/^fair\-plugin\-(\d+\.\d+\.\d+)\.zip$/', $asset->name) !== false => 'plugin',
        $asset->name === 'MD5SUMS' => 'md5sum',
        $asset->name === 'SHA1SUMS' => 'sha1sum',
        $asset->name === 'SHA256SUMS' => 'sha256sum',
        $asset->name === 'SHA384SUMS' => 'sha384sum',
        preg_match('/^wordpress\-(\d+\.\d+\.\d+)\-fair\.zip$/', $asset->name) !== false => 'wordpress',
        default => 'others',
      },
    ],
    $response_data->assets,
  ),
);

// Get the first asset that matches the "plugin" type
$plugin_zip = array_filter(array_values($assets_map), fn($asset) => $asset->type === 'plugin')[0] ?? false;
if ($plugin_zip === false) {
  throw new \Exception('Unable to find the plugin zip in the latest release assets');
}

// Download the zip
echo "Downloading: {$plugin_zip->browser_download_url}\n";
$filename = tempnam(sys_get_temp_dir(), 'fair-plugin') . '.zip';
$zip_content = file_get_contents($plugin_zip->browser_download_url, context: $context);
file_put_contents($filename, $zip_content);
echo "Downloaded to {$filename}\n";

// Unzip the file to this folder
$zip = new ZipArchive();
echo "Open {$filename}\n";
if (!$zip->open($filename)) {
  throw new \Exception("Unable to open: {$filename}");
}
$dest = './';
echo "Extract {$filename} to {$dest}\n";
$zip->extractTo($dest);
$zip->close();
