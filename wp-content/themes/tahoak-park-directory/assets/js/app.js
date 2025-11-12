(function () {
	const navToggle = document.querySelector('[data-nav-toggle]');
	const nav = document.querySelector('[data-nav]');

	const updateNavState = (open) => {
		if (!navToggle || !nav) {
			return;
		}
		navToggle.setAttribute('aria-expanded', String(open));
		nav.classList.toggle('is-open', open);
	};

	if (navToggle && nav) {
		// Default closed for mobile; open on desktop loads
		const desktopMq = window.matchMedia('(min-width: 900px)');

		const syncWithViewport = (mq) => {
			updateNavState(mq.matches);
		};

		navToggle.addEventListener('click', () => {
			const isOpen = nav.classList.contains('is-open');
			updateNavState(!isOpen);
		});

		desktopMq.addEventListener('change', (event) => {
			syncWithViewport(event);
		});

		syncWithViewport(desktopMq);
	}

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
