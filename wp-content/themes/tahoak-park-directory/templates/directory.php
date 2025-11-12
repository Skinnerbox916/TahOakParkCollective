<?php
/**
 * Directory template.
 */

global $wp;

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
	<p><?php esc_html_e( 'Browse local businesses, explore them on the map, and keep your spending close to home.', 'tahoak-directory' ); ?></p>
</section>

<section class="directory-grid">
	<aside class="directory-controls" aria-label="Directory filters">
		<h2><?php esc_html_e( 'Find what you need', 'tahoak-directory' ); ?></h2>
		<form id="tahoak-directory-search" class="directory-search" method="get" action="<?php echo esc_url( home_url( $wp->request ) ); ?>">
			<label for="tahoak-search">
				<?php esc_html_e( 'Search by name', 'tahoak-directory' ); ?>
				<input type="search" id="tahoak-search" name="search" placeholder="<?php esc_attr_e( 'E.g. coffee, bakery, childcare…', 'tahoak-directory' ); ?>" />
			</label>

			<label for="tahoak-service-type">
				<?php esc_html_e( 'Business type', 'tahoak-directory' ); ?>
				<select id="tahoak-service-type" name="service_type">
					<option value="all"><?php esc_html_e( 'All categories', 'tahoak-directory' ); ?></option>
					<?php if ( ! is_wp_error( $service_terms ) ) : ?>
						<?php foreach ( $service_terms as $term ) : ?>
							<option value="<?php echo esc_attr( $term->slug ); ?>"><?php echo esc_html( $term->name ); ?></option>
						<?php endforeach; ?>
					<?php endif; ?>
				</select>
			</label>

			<button type="submit"><?php esc_html_e( 'Search directory', 'tahoak-directory' ); ?></button>
		</form>

		<div class="directory-controls__links">
			<a href="<?php echo esc_url( home_url( '/add-or-update-business/' ) ); ?>"><?php esc_html_e( 'Request to add your business', 'tahoak-directory' ); ?></a>
		</div>
	</aside>

	<div class="directory-map" id="tahoak-map">
		<p><?php esc_html_e( 'Interactive map coming soon. Filter businesses on the left, then open them in Google Maps from the list below.', 'tahoak-directory' ); ?></p>
	</div>
</section>

<section class="directory-results" aria-live="polite">
	<h2><?php esc_html_e( 'Business listings', 'tahoak-directory' ); ?></h2>

	<?php if ( $business_query->have_posts() ) : ?>
		<ul class="directory-list__items">
			<?php
			while ( $business_query->have_posts() ) :
				$business_query->the_post();
				$terms    = get_the_terms( get_the_ID(), 'service_type' );
				$slugs    = $terms && ! is_wp_error( $terms ) ? implode( ',', wp_list_pluck( $terms, 'slug' ) ) : 'all';
				$maps_url = get_post_meta( get_the_ID(), 'google_maps_url', true );
				$address  = get_post_meta( get_the_ID(), 'address', true );
				$website  = get_post_meta( get_the_ID(), 'website', true );
				?>
				<li class="directory-list__item" data-service-types="<?php echo esc_attr( $slugs ); ?>">
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
</section>

<?php
get_footer();
