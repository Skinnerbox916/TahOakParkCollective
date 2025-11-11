<?php

namespace Tahoak\Directory;

final class Plugin {
	private static $instance;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->init();
		}

		return self::$instance;
	}

	private function init(): void {
		require_once __DIR__ . '/class-post-types.php';
		require_once __DIR__ . '/class-taxonomies.php';
		require_once __DIR__ . '/class-meta.php';
		require_once __DIR__ . '/class-admin.php';
		require_once __DIR__ . '/class-requests.php';
		require_once __DIR__ . '/class-forms.php';

		Post_Types::instance();
		Taxonomies::instance();
		Meta::instance();
		Admin::instance();
		Requests::instance();
		Forms::instance();
	}
}
