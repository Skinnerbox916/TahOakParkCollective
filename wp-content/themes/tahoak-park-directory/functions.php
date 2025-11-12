<?php

defined( 'ABSPATH' ) || exit;

/** Register theme assets. */
add_action( 'wp_enqueue_scripts', function () {
	$theme_version = wp_get_theme()->get( 'Version' );

	wp_enqueue_style( 'tahoak-directory-style', get_stylesheet_uri(), [], $theme_version );
	wp_enqueue_style( 'tahoak-directory-app', get_template_directory_uri() . '/assets/css/app.css', [], $theme_version );
	wp_enqueue_script( 'tahoak-directory-app', get_template_directory_uri() . '/assets/js/app.js', [ 'wp-element' ], $theme_version, true );
} );

/** Support features. */
add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' );
} );

/** Register navigation menus. */
add_action( 'after_setup_theme', function () {
	register_nav_menus( [
		'primary' => __( 'Primary Menu', 'tahoak-directory' ),
	] );
} );

/** Register block pattern category for future use. */
add_action( 'init', function () {
	register_block_pattern_category( 'tahoak-directory', [
		'label' => __( 'Tahoe Directory', 'tahoak-directory' ),
	] );
} );
