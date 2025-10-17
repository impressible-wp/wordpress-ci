<?php

/**
 * Plugin Name:       My Plugin
 * Plugin URI:        https://github.com/impressible-wp/wordpress-ci
 * Description:       An example WordPress plugin.
 * Version:           1.0.0
 * Requires PHP:      8.0
 * Author:            Koala Yeung
 * Author URI:        https://github.com/yookoala/
 * License:           MIT License
 * License URI:       https://opensource.org/licenses/MIT
 */

// Make sure we don't expose any info if called directly
if ( !function_exists( 'add_filter' ) || !function_exists( 'is_front_page' ) ) {
    echo 'Hi there!  I\'m just a plugin, not much I can do when called directly.';
    exit;
}

/**
 * Adds a custom HTML message to the top of the content on the front page.
 *
 * @param string $content The original content of the post/page.
 * @return string The modified content with the message prepended.
 */
function my_custom_frontpage_message( $content ) {
    $custom_message = '<div style="padding: 15px; margin-bottom: 20px; background-color: #e7f3fe; border-left: 6px solid #2196F3;">';
    $custom_message .= '<h3>A Message from My Plugin</h3>';
    $custom_message .= '<p>My Plugin is active!</p>';
    $custom_message .= '</div>';

    // 3. Prepend your message to the original content.
    return $custom_message . $content;
}

// 5. Hook the function into WordPress.
add_filter( 'the_content', my_custom_frontpage_message(...) );
