# WordPress Environment Snapshot

Date: 2025-11-11

## Container Topology
- `wordpress-wordpress-1` (`wordpress:php8.4-fpm-alpine`) – running for ~2 months.
- `wordpress-db-1` (`mariadb:11.4.7`) – paired database container.

Docker Compose network: reused `proxy` network already managed by Caddy.

## WordPress Core
- Version: **6.8.3** (`docker exec wordpress-wordpress-1 php -r 'include "/var/www/html/wp-includes/version.php"; echo $wp_version;'`)
- WordPress files mounted at `/srv/data/wordpress/html` on Jarvis (`/home/skinner/jarvis/srv/data/wordpress/html` from Framebuntu).
- WP-CLI: **Not installed** inside the container (`docker exec wordpress-wordpress-1 wp …` fails). Consider installing for workflow automation.

## Themes & Plugins
- Themes present: `twentytwentyfive`, `twentytwentyfour`, `twentytwentythree` (plus `index.php` placeholder).
- Plugins present: `redis-cache` (default placeholder `index.php` otherwise). Need to verify if Redis cache is in use before removing.

## Configuration Notes
- `wp-config.php` defers to Docker env vars via `getenv_docker(...)`.
- Container env values (from `docker inspect wordpress-wordpress-1`) include:
  - `WORDPRESS_DB_HOST=db:3306`
  - `WORDPRESS_DB_NAME=wordpress`
  - `WORDPRESS_DB_USER=wpuser`
  - `WORDPRESS_DB_PASSWORD=Mark.Tom.and.TravisWP`
  - `MYSQL_ROOT_PASSWORD=Mark.Tom.and.Travisroot`
- `wp-config.php` & filesystem otherwise look stock; minimal customizations so far.

## Outstanding Questions / Next Steps
- Do we want WP-CLI installed in the container (likely yes)?
- Confirm whether the Redis cache plugin is configured/required.
- Determine target domain + update Caddy + WordPress site URLs accordingly.
- Back up existing database/content before we start modifications.
