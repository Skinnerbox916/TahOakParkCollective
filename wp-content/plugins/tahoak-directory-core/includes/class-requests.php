<?php

namespace Tahoak\Directory;

class Requests {
	private static $instance;

	private const META_FIELDS = [
		'business_name'   => 'sanitize_text_field',
		'address'         => 'sanitize_text_field',
		'service_type'    => 'sanitize_text_field',
		'contact_name'    => 'sanitize_text_field',
		'contact_email'   => 'sanitize_email',
		'request_type'    => 'sanitize_text_field',
		'notes'           => 'sanitize_textarea_field',
	];

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->hooks();
		}

		return self::$instance;
	}

	private function hooks(): void {
		add_action( 'init', [ $this, 'register_cpt' ] );
	}

	public function register_cpt(): void {
		$labels = [
			'name'          => __( 'Directory Requests', 'tahoak-directory' ),
			'singular_name' => __( 'Directory Request', 'tahoak-directory' ),
			'add_new'       => __( 'Add Request', 'tahoak-directory' ),
			'edit_item'     => __( 'Review Request', 'tahoak-directory' ),
			'menu_name'     => __( 'Directory Requests', 'tahoak-directory' ),
		];

		register_post_type( 'directory_request', [
			'labels'             => $labels,
			'public'             => false,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'show_in_admin_bar'  => true,
			'supports'           => [ 'title', 'editor' ],
			'menu_icon'          => 'dashicons-email-alt2',
			'capability_type'    => 'post',
			'has_archive'        => false,
			'show_in_rest'       => false,
		] );

		foreach ( self::META_FIELDS as $key => $sanitize ) {
			register_post_meta( 'directory_request', $key, [
				'single'            => true,
				'show_in_rest'      => false,
				'sanitize_callback' => $sanitize,
			] );
		}
	}

	public function store_request( array $data ): int {
		$sanitized = [];

		foreach ( self::META_FIELDS as $key => $sanitize ) {
			$raw                 = $data[ $key ] ?? '';
			$sanitized[ $key ]   = call_user_func( $sanitize, $raw );
		}

		$title = sprintf(
			'%s request for %s',
			ucfirst( $sanitized['request_type'] ?: __( 'Listing', 'tahoak-directory' ) ),
			$sanitized['business_name'] ?: __( 'Unnamed Business', 'tahoak-directory' )
		);

		$post_id = wp_insert_post( [
			'post_type'   => 'directory_request',
			'post_status' => 'pending',
			'post_title'  => $title,
			'post_content'=> wp_kses_post( $sanitized['notes'] ),
		] );

		if ( is_wp_error( $post_id ) ) {
			return 0;
		}

		foreach ( $sanitized as $key => $value ) {
			if ( 'notes' === $key ) {
				continue; // Already stored in post_content.
			}
			update_post_meta( $post_id, $key, $value );
		}

		$this->maybe_email_request( $post_id, $sanitized );

		return $post_id;
	}

	private function maybe_email_request( int $post_id, array $data ): void {
		$to      = apply_filters( 'tahoak_directory_request_email_to', get_option( 'admin_email' ) );
		$subject = sprintf( __( '[Tahoe Directory] %s request: %s', 'tahoak-directory' ), ucfirst( $data['request_type'] ), $data['business_name'] );

		$body = sprintf(
			"Business: %s\nAddress: %s\nService Type: %s\nContact: %s (%s)\nRequest Type: %s\n---\n%s\n",
			$data['business_name'] ?: '—',
			$data['address'] ?: '—',
			$data['service_type'] ?: '—',
			$data['contact_name'] ?: '—',
			$data['contact_email'] ?: '—',
			ucfirst( $data['request_type'] ?: 'update' ),
			$data['notes'] ?: 'No additional details.'
		);

		$body .= sprintf( "\nAdmin link: %s", admin_url( sprintf( 'post.php?post=%d&action=edit', $post_id ) ) );

		wp_mail( $to, $subject, $body );
	}
}
