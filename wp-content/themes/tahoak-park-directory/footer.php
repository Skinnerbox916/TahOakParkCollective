<?php
/**
 * Footer template.
 */
?>
</main>
<footer class="site-footer">
	<div class="site-footer__inner">
		<p>&copy; <?php echo esc_html( date( 'Y' ) ); ?> Tahoe Park Business Directory</p>
		<p><a href="mailto:<?php echo antispambot( get_option( 'admin_email' ) ); ?>">Contact the team</a></p>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
