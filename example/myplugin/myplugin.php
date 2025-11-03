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
    static $shown;
    if ($shown === TRUE) {
        return $content;
    }
    $shown = TRUE;

    $custom_message = <<<HTML
    <style>
    .my-plugin-message {
        padding: 15px;
        margin-bottom: 20px;
        background-color: #e7f3fe;
        border-left: 6px solid #2196F3;
    }
    </style>
    HTML;

    // Plugin installation success message
    $custom_message .= <<<HTML
    <div class="my-plugin-message">';
        <h3>A Message from My Plugin</h3>
        <p>My Plugin is active!</p>
    </div>
    HTML;

    // Username display message
    $username = is_user_logged_in()
        ? wp_get_current_user()->user_login ?? '(unknown)'
        : 'Visitor';
    $custom_message .= <<<HTML
    <div class="my-plugin-message">
        <p>Welcome, {$username}!</p>
    </div>
    HTML;

    // Prepend your message to the original content.
    return $custom_message . "\n" . $content;
}

// 5. Hook the function into WordPress.
add_filter( 'the_content', my_custom_frontpage_message(...) );

/**
 * Add a custom routing rule for the page "/custom-content"
 *
 * @return void
 */
function myplugin_add_rewrite_rules() {
    add_rewrite_rule( '^custom-content/?$', 'index.php?myplugin_custom_page=1', 'top' );
}
add_action( 'init', myplugin_add_rewrite_rules(...) );

/**
 * Register the custom query variable "myplugin_custom_page" for routing
 */
function myplugin_register_query_vars( $vars ) {
    $vars[] = 'myplugin_custom_page';
    return $vars;
}
add_filter( 'query_vars', myplugin_register_query_vars(...) );

/**
 * Load custom template for the custom route
 */
function myplugin_load_custom_template( $template ) {
    if ( get_query_var( 'myplugin_custom_page' ) ) {
        header( 'Content-Type: application/json' );
        echo json_encode( array( 'message' => 'Hello from My Plugin!' ) );
        exit();
    }
    return $template;
}
add_filter( 'template_include', myplugin_load_custom_template(...) );
