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
		<nav class="site-nav" aria-label="Primary menu">
			<?php
			wp_nav_menu( [
				'theme_location' => 'primary',
				'menu_class'     => 'site-nav__menu',
				'container'      => false,
				'fallback_cb'    => false,
			] );
			?>
		</nav>
	</div>
</header>
<main class="site-main">
