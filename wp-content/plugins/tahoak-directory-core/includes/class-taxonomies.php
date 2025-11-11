<?php

namespace Tahoak\Directory;

class Taxonomies {
	private static $instance;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->hooks();
		}

		return self::$instance;
	}

	private function hooks(): void {
		add_action( 'init', [ $this, 'register_taxonomies' ] );
	}

	public function register_taxonomies(): void {
		$service_labels = [
			'name'          => __( 'Service Types', 'tahoak-directory' ),
			'singular_name' => __( 'Service Type', 'tahoak-directory' ),
		];

		register_taxonomy(
			'service_type',
			[ 'business' ],
			[
				'labels'            => $service_labels,
				'public'            => true,
				'hierarchical'      => true,
				'show_admin_column' => true,
				'show_in_rest'      => true,
			]
		);

		$feature_labels = [
			'name'          => __( 'Feature Tags', 'tahoak-directory' ),
			'singular_name' => __( 'Feature Tag', 'tahoak-directory' ),
		];

		register_taxonomy(
			'feature_tag',
			[ 'business' ],
			[
				'labels'            => $feature_labels,
				'public'            => true,
				'hierarchical'      => false,
				'show_admin_column' => true,
				'show_in_rest'      => true,
			]
		);
	}
}
