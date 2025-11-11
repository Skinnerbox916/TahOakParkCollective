<?php
/**
 * Plugin Name: Tahoe Park Directory Core
 * Description: Custom post types, taxonomies, and meta needed for the Tahoe Park Business Directory.
 * Version: 0.1.0
 * Author: Skinnerbox916
 */

defined( 'ABSPATH' ) || exit;

define( 'TAHOAK_DIRECTORY_CORE_VERSION', '0.1.0' );
define( 'TAHOAK_DIRECTORY_CORE_PATH', plugin_dir_path( __FILE__ ) );
define( 'TAHOAK_DIRECTORY_CORE_URL', plugin_dir_url( __FILE__ ) );

require_once TAHOAK_DIRECTORY_CORE_PATH . 'includes/class-tahoak-directory-plugin.php';

\Tahoak\Directory\Plugin::instance();
