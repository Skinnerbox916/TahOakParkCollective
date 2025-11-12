(function () {
	// Mobile navigation toggle
	const navToggle = document.querySelector('[data-nav-toggle]');
	const nav = document.querySelector('[data-nav]');

	if (navToggle && nav) {
		navToggle.addEventListener('click', () => {
			const expanded = navToggle.getAttribute('aria-expanded') === 'true';
			navToggle.setAttribute('aria-expanded', String(!expanded));
			nav.classList.toggle('is-open', !expanded);
		});
	}

	// Directory filtering (client-side placeholder)
	const form = document.querySelector('#tahoak-directory-search');
	const listItems = document.querySelectorAll('[data-service-types]');

	if (form && listItems.length) {
		form.addEventListener('submit', (event) => {
			event.preventDefault();

			const searchValue = form.querySelector('[name="search"]')?.value.trim().toLowerCase() ?? '';
			const selectedType = form.querySelector('[name="service_type"]')?.value ?? 'all';

			listItems.forEach((item) => {
				const types = item.getAttribute('data-service-types')?.split(',') ?? [];
				const title = item.querySelector('h2')?.textContent.toLowerCase() ?? '';

				const matchesType = selectedType === 'all' || types.includes(selectedType);
				const matchesSearch = !searchValue || title.includes(searchValue);

				item.style.display = matchesType && matchesSearch ? '' : 'none';
			});
		});
	}
})();
