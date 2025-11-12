<?php
/**
 * Directory template.
 */

get_header();

$service_terms = get_terms(
	[
		'taxonomy'   => 'service_type',
		'hide_empty' => false,
		'orderby'    => 'name',
	]
);

$business_query = new WP_Query(
	[
		'post_type'      => 'business',
		'posts_per_page' => -1,
		'orderby'        => 'title',
		'order'          => 'ASC',
	]
);
?>
<section class="directory-hero">
	<h1><?php esc_html_e( 'Tahoe Park & Oak Park Business Directory', 'tahoak-directory' ); ?></h1>
	<p><?php esc_html_e( 'Discover neighborhood businesses by category and explore them on the map.', 'tahoak-directory' ); ?></p>
</section>

<section class="directory-layout">
	<div class="directory-map" id="tahoak-map">
		<p style="padding: 1.5rem;">
			<?php esc_html_e( 'Interactive map coming soon. In the meantime, browse the list and open Google Maps from each card.', 'tahoak-directory' ); ?>
		</p>
	</div>

	<div class="directory-list">
		<div class="directory-filters" role="toolbar">
			<button class="directory-filter-btn is-active" data-filter-service="all" type="button"><?php esc_html_e( 'All', 'tahoak-directory' ); ?></button>
			<?php if ( ! is_wp_error( $service_terms ) ) : ?>
				<?php foreach ( $service_terms as $term ) : ?>
					<button class="directory-filter-btn" data-filter-service="<?php echo esc_attr( $term->slug ); ?>" type="button"><?php echo esc_html( $term->name ); ?></button>
				<?php endforeach; ?>
			<?php endif; ?>
		</div>

		<?php if ( $business_query->have_posts() ) : ?>
			<ul class="directory-list__items">
				<?php
				while ( $business_query->have_posts() ) :
					$business_query->the_post();
					$terms    = get_the_terms( get_the_ID(), 'service_type' );
					$slugs    = $terms && ! is_wp_error( $terms ) ? implode( ',', wp_list_pluck( $terms, 'slug' ) ) : '';
					$maps_url = get_post_meta( get_the_ID(), 'google_maps_url', true );
					$address  = get_post_meta( get_the_ID(), 'address', true );
					$website  = get_post_meta( get_the_ID(), 'website', true );
					?>
					<li class="directory-list__item" data-service-types="<?php echo esc_attr( $slugs ?: 'uncategorized' ); ?>">
						<h2><?php the_title(); ?></h2>
						<?php if ( $terms && ! is_wp_error( $terms ) ) : ?>
							<p><strong><?php esc_html_e( 'Category:', 'tahoak-directory' ); ?></strong> <?php echo esc_html( implode( ', ', wp_list_pluck( $terms, 'name' ) ) ); ?></p>
						<?php endif; ?>
						<?php if ( $address ) : ?>
							<p><?php echo esc_html( $address ); ?></p>
						<?php endif; ?>
						<div class="directory-list__actions">
							<?php if ( $maps_url ) : ?>
								<a class="directory-list__map-link" href="<?php echo esc_url( $maps_url ); ?>" target="_blank" rel="noopener">
									<?php esc_html_e( 'Open in Google Maps', 'tahoak-directory' ); ?>
								</a>
							<?php endif; ?>
							<?php if ( $website ) : ?>
								<span class="directory-list__divider">&bull;</span>
								<a class="directory-list__website" href="<?php echo esc_url( $website ); ?>" target="_blank" rel="noopener">
									<?php esc_html_e( 'Website', 'tahoak-directory' ); ?>
								</a>
							<?php endif; ?>
						</div>
					</li>
				<?php endwhile; ?>
			</ul>
		<?php else : ?>
			<p><?php esc_html_e( 'No businesses have been added yet. Check back soon!', 'tahoak-directory' ); ?></p>
		<?php endif; ?>
		<?php wp_reset_postdata(); ?>

		<div class="tahoak-request-form">
			<h2><?php esc_html_e( 'Add or update a business', 'tahoak-directory' ); ?></h2>
			<?php echo do_shortcode( '[tahoak_business_request_form]' ); ?>
		</div>
	</div>
</section>

<?php
get_footer();
