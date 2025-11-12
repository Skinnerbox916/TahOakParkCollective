<?php
/**
 * Header template.
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header class="site-header">
	<div class="site-header__inner">
		<a class="site-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
			<strong><?php bloginfo( 'name' ); ?></strong>
		</a>
		<button class="site-nav__toggle" type="button" aria-expanded="false" data-nav-toggle>
			<span class="site-nav__burger" aria-hidden="true"></span>
			<span class="screen-reader-text"><?php esc_html_e( 'Toggle navigation', 'tahoak-directory' ); ?></span>
		</button>
		<nav class="site-nav" aria-label="Primary menu" data-nav>
			<?php
			wp_nav_menu( [
				'theme_location' => 'primary',
				'menu_class'     => 'site-nav__menu',
				'container'      => false,
				'fallback_cb'    => false,
				'link_before'    => '<span class="site-nav__link">',
				'link_after'     => '</span>',
			] );
			?>
		</nav>
	</div>
</header>
<main class="site-main">
