<?php

namespace Tahoak\Directory;

class Post_Types {
	private static $instance;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->hooks();
		}

		return self::$instance;
	}

	private function hooks(): void {
		add_action( 'init', [ $this, 'register_business_post_type' ] );
	}

	public function register_business_post_type(): void {
		$labels = [
			'name'               => __( 'Businesses', 'tahoak-directory' ),
			'singular_name'      => __( 'Business', 'tahoak-directory' ),
			'add_new_item'       => __( 'Add New Business', 'tahoak-directory' ),
			'edit_item'          => __( 'Edit Business', 'tahoak-directory' ),
			'new_item'           => __( 'New Business', 'tahoak-directory' ),
			'view_item'          => __( 'View Business', 'tahoak-directory' ),
			'view_items'         => __( 'View Businesses', 'tahoak-directory' ),
			'search_items'       => __( 'Search Businesses', 'tahoak-directory' ),
			'not_found'          => __( 'No businesses found.', 'tahoak-directory' ),
			'all_items'          => __( 'All Businesses', 'tahoak-directory' ),
		];

		$args = [
			'labels'             => $labels,
			'public'             => true,
			'has_archive'        => true,
			'show_in_rest'       => true,
			'menu_icon'          => 'dashicons-store',
			'supports'           => [ 'title', 'editor', 'thumbnail', 'excerpt' ],
			'rewrite'            => [ 'slug' => 'businesses' ],
		];

		register_post_type( 'business', $args );
	}
}
