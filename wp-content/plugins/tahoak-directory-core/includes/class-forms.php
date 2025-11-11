<?php

namespace Tahoak\Directory;

class Forms {
	private static $instance;

	private const SHORTCODE = 'tahoak_business_request_form';
	private const FORM_ACTION = 'tahoak_submit_request';
	private const NONCE_FIELD = '_tahoak_request_nonce';
	private const HONEYPOT_FIELD = 'tahoak_hp';

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->hooks();
		}

		return self::$instance;
	}

	private function hooks(): void {
		add_shortcode( self::SHORTCODE, [ $this, 'render_form' ] );
		add_action( 'init', [ $this, 'handle_submission' ] );
	}

	public function handle_submission(): void {
		if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
			return;
		}

		if ( ! isset( $_POST['tahoak_form_action'] ) || self::FORM_ACTION !== $_POST['tahoak_form_action'] ) {
			return;
		}

		if ( ! isset( $_POST[ self::NONCE_FIELD ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ self::NONCE_FIELD ] ) ), self::FORM_ACTION ) ) {
			wp_safe_redirect( add_query_arg( 'request_status', 'invalid', wp_get_referer() ?: home_url() ) );
			exit;
		}

		if ( ! empty( $_POST[ self::HONEYPOT_FIELD ] ) ) {
			wp_safe_redirect( add_query_arg( 'request_status', 'spam', wp_get_referer() ?: home_url() ) );
			exit;
		}

		$data = [
			'business_name' => sanitize_text_field( wp_unslash( $_POST['business_name'] ?? '' ) ),
			'address'       => sanitize_text_field( wp_unslash( $_POST['address'] ?? '' ) ),
			'service_type'  => sanitize_text_field( wp_unslash( $_POST['service_type'] ?? '' ) ),
			'contact_name'  => sanitize_text_field( wp_unslash( $_POST['contact_name'] ?? '' ) ),
			'contact_email' => sanitize_email( wp_unslash( $_POST['contact_email'] ?? '' ) ),
			'request_type'  => sanitize_text_field( wp_unslash( $_POST['request_type'] ?? 'update' ) ),
			'notes'         => sanitize_textarea_field( wp_unslash( $_POST['notes'] ?? '' ) ),
		];

		// Validate required fields.
		$required = [ 'business_name', 'service_type', 'contact_email' ];
		foreach ( $required as $field ) {
			if ( empty( $data[ $field ] ) ) {
				wp_safe_redirect( add_query_arg( 'request_status', 'missing', wp_get_referer() ?: home_url() ) );
				exit;
			}
		}

		// Store request.
		$post_id = Requests::instance()->store_request( $data );

		$status = $post_id ? 'success' : 'error';

		wp_safe_redirect( add_query_arg( 'request_status', $status, wp_get_referer() ?: home_url() ) );
		exit;
	}

	public function render_form(): string {
		$status = sanitize_text_field( wp_unslash( $_GET['request_status'] ?? '' ) );
		$messages = [
			'success' => __( 'Thanks! We received your request and will review it soon.', 'tahoak-directory' ),
			'error'   => __( 'Something went wrong. Please try again or email us.', 'tahoak-directory' ),
			'missing' => __( 'Please fill in all required fields.', 'tahoak-directory' ),
			'invalid' => __( 'Session expired, please submit the form again.', 'tahoak-directory' ),
			'spam'    => __( 'Submission blocked. If this is an error, contact us directly.', 'tahoak-directory' ),
		];

		$service_types = get_terms( [
			'taxonomy'   => 'service_type',
			'hide_empty' => false,
			'orderby'    => 'name',
		] );

		ob_start();
		?>
		<div class="tahoak-request-form">
			<?php if ( isset( $messages[ $status ] ) ) : ?>
				<div class="tahoak-request-alert tahoak-request-alert--<?php echo esc_attr( $status ); ?>"><?php echo esc_html( $messages[ $status ] ); ?></div>
			<?php endif; ?>

			<form method="post" class="tahoak-form" novalidate>
				<?php wp_nonce_field( self::FORM_ACTION, self::NONCE_FIELD ); ?>
				<input type="hidden" name="tahoak_form_action" value="<?php echo esc_attr( self::FORM_ACTION ); ?>" />
				<input type="text" name="<?php echo esc_attr( self::HONEYPOT_FIELD ); ?>" tabindex="-1" autocomplete="off" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden" aria-hidden="true" />

				<div class="tahoak-form__group">
					<label for="tahoak-business-name"><?php esc_html_e( 'Business name', 'tahoak-directory' ); ?> *</label>
					<input type="text" id="tahoak-business-name" name="business_name" required />
				</div>

				<div class="tahoak-form__group">
					<label for="tahoak-address"><?php esc_html_e( 'Address', 'tahoak-directory' ); ?></label>
					<input type="text" id="tahoak-address" name="address" />
				</div>

				<div class="tahoak-form__group">
					<label for="tahoak-service-type"><?php esc_html_e( 'Type of business', 'tahoak-directory' ); ?> *</label>
					<select id="tahoak-service-type" name="service_type" required>
						<option value=""><?php esc_html_e( 'Select a category', 'tahoak-directory' ); ?></option>
						<?php if ( ! is_wp_error( $service_types ) ) : ?>
							<?php foreach ( $service_types as $term ) : ?>
								<option value="<?php echo esc_attr( $term->slug ); ?>"><?php echo esc_html( $term->name ); ?></option>
							<?php endforeach; ?>
						<?php endif; ?>
					</select>
				</div>

				<div class="tahoak-form__group">
					<label for="tahoak-request-type"><?php esc_html_e( 'Request type', 'tahoak-directory' ); ?></label>
					<select id="tahoak-request-type" name="request_type">
						<option value="new"><?php esc_html_e( 'New business listing', 'tahoak-directory' ); ?></option>
						<option value="update"><?php esc_html_e( 'Update existing listing', 'tahoak-directory' ); ?></option>
					</select>
				</div>

				<div class="tahoak-form__group">
					<label for="tahoak-contact-name"><?php esc_html_e( 'Your name', 'tahoak-directory' ); ?></label>
					<input type="text" id="tahoak-contact-name" name="contact_name" />
				</div>

				<div class="tahoak-form__group">
					<label for="tahoak-contact-email"><?php esc_html_e( 'Your email', 'tahoak-directory' ); ?> *</label>
					<input type="email" id="tahoak-contact-email" name="contact_email" required />
				</div>

				<div class="tahoak-form__group">
					<label for="tahoak-notes"><?php esc_html_e( 'Tell us what to add or change', 'tahoak-directory' ); ?></label>
					<textarea id="tahoak-notes" name="notes" rows="4"></textarea>
				</div>

				<button type="submit" class="tahoak-form__submit"><?php esc_html_e( 'Send request', 'tahoak-directory' ); ?></button>
			</form>
		</div>
		<?php
		return ob_get_clean();
	}
}
