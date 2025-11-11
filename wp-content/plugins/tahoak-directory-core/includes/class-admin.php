<?php

namespace Tahoak\Directory;

class Admin {
	private static $instance;

	private const META_BOX_ID = 'tahoak_business_details';
	private const NONCE_FIELD = 'tahoak_business_details_nonce';

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->hooks();
		}

		return self::$instance;
	}

	private function hooks(): void {
		add_action( 'add_meta_boxes', [ $this, 'register_meta_boxes' ] );
		add_action( 'save_post_business', [ $this, 'save_business_meta' ] );

		add_filter( 'manage_edit-business_columns', [ $this, 'register_columns' ] );
		add_action( 'manage_business_posts_custom_column', [ $this, 'render_column' ], 10, 2 );
		add_filter( 'manage_edit-business_sortable_columns', [ $this, 'sortable_columns' ] );
	}

	public function register_meta_boxes(): void {
		add_meta_box(
			self::META_BOX_ID,
			__( 'Business Details', 'tahoak-directory' ),
			[ $this, 'render_meta_box' ],
			'business',
			'normal',
			'high'
		);
	}

	public function render_meta_box( \WP_Post $post ): void {
		wp_nonce_field( 'tahoak_save_business_details', self::NONCE_FIELD );

		$meta = [
			'google_maps_url' => get_post_meta( $post->ID, 'google_maps_url', true ),
			'address'         => get_post_meta( $post->ID, 'address', true ),
			'phone'           => get_post_meta( $post->ID, 'phone', true ),
			'hours'           => get_post_meta( $post->ID, 'hours', true ),
			'website'         => get_post_meta( $post->ID, 'website', true ),
		];
		?>
		<p><?php esc_html_e( 'Enter the basic details shown on the directory and the external link visitors can use to get directions or more info.', 'tahoak-directory' ); ?></p>

		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row"><label for="tahoak-google-maps-url"><?php esc_html_e( 'Google Maps URL', 'tahoak-directory' ); ?></label></th>
					<td>
						<input type="url" class="regular-text" id="tahoak-google-maps-url" name="tahoak_business[google_maps_url]" value="<?php echo esc_attr( $meta['google_maps_url'] ); ?>" required />
						<p class="description"><?php esc_html_e( 'Use the Google Maps “Share” link so it opens directions/details in a new tab.', 'tahoak-directory' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="tahoak-address"><?php esc_html_e( 'Address', 'tahoak-directory' ); ?></label></th>
					<td><input type="text" class="regular-text" id="tahoak-address" name="tahoak_business[address]" value="<?php echo esc_attr( $meta['address'] ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="tahoak-phone"><?php esc_html_e( 'Phone', 'tahoak-directory' ); ?></label></th>
					<td><input type="text" class="regular-text" id="tahoak-phone" name="tahoak_business[phone]" value="<?php echo esc_attr( $meta['phone'] ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="tahoak-hours"><?php esc_html_e( 'Hours', 'tahoak-directory' ); ?></label></th>
					<td><textarea class="large-text" rows="3" id="tahoak-hours" name="tahoak_business[hours]"><?php echo esc_textarea( $meta['hours'] ); ?></textarea></td>
				</tr>
				<tr>
					<th scope="row"><label for="tahoak-website"><?php esc_html_e( 'Website', 'tahoak-directory' ); ?></label></th>
					<td><input type="url" class="regular-text" id="tahoak-website" name="tahoak_business[website]" value="<?php echo esc_attr( $meta['website'] ); ?>" /></td>
				</tr>
			</tbody>
		</table>
		<?php
	}

	public function save_business_meta( int $post_id ): void {
		if ( ! isset( $_POST[ self::NONCE_FIELD ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ self::NONCE_FIELD ] ) ), 'tahoak_save_business_details' ) ) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$data = wp_unslash( $_POST['tahoak_business'] ?? [] );

		$fields = [
			'google_maps_url' => 'esc_url_raw',
			'address'         => 'sanitize_text_field',
			'phone'           => 'sanitize_text_field',
			'hours'           => 'sanitize_textarea_field',
			'website'         => 'esc_url_raw',
		];

		foreach ( $fields as $key => $sanitize ) {
			$value = $data[ $key ] ?? '';
			$value = call_user_func( $sanitize, $value );

			if ( empty( $value ) ) {
				delete_post_meta( $post_id, $key );
			} else {
				update_post_meta( $post_id, $key, $value );
			}
		}
	}

	public function register_columns( array $columns ): array {
		$columns['service_type'] = __( 'Service Type', 'tahoak-directory' );
		$columns['maps_link']    = __( 'Map Link', 'tahoak-directory' );

		return $columns;
	}

	public function render_column( string $column, int $post_id ): void {
		if ( 'service_type' === $column ) {
			$terms = get_the_terms( $post_id, 'service_type' );
			if ( empty( $terms ) || is_wp_error( $terms ) ) {
				echo '&mdash;';
				return;
			}

			echo esc_html( implode( ', ', wp_list_pluck( $terms, 'name' ) ) );
			return;
		}

		if ( 'maps_link' === $column ) {
			$link = get_post_meta( $post_id, 'google_maps_url', true );
			if ( ! $link ) {
				echo '&mdash;';
				return;
			}

			printf( '<a href="%1$s" target="_blank" rel="noopener">%2$s</a>', esc_url( $link ), esc_html__( 'Open map', 'tahoak-directory' ) );
		}
	}

	public function sortable_columns( array $columns ): array {
		$columns['service_type'] = 'service_type';

		return $columns;
	}
}
