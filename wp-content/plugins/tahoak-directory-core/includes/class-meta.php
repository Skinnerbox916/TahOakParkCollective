<?php

namespace Tahoak\Directory;

class Meta {
	private static $instance;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->hooks();
		}

		return self::$instance;
	}

	private function hooks(): void {
		add_action( 'init', [ $this, 'register_meta' ] );
	}

	public function register_meta(): void {
		$meta_keys = [
			'google_maps_url' => [
				'sanitize_callback' => 'esc_url_raw',
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
			],
			'address' => [
				'sanitize_callback' => 'sanitize_text_field',
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
			],
			'phone' => [
				'sanitize_callback' => 'sanitize_text_field',
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
			],
			'hours' => [
				'sanitize_callback' => 'sanitize_textarea_field',
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
			],
			'website' => [
				'sanitize_callback' => 'esc_url_raw',
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
			],
		];

		foreach ( $meta_keys as $key => $args ) {
			register_post_meta( 'business', $key, $args );
		}
	}
}
