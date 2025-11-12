(function() {
	const filterButtons = document.querySelectorAll('[data-filter-service]');
	const listItems = document.querySelectorAll('[data-service-types]');

	if (!filterButtons.length || !listItems.length) {
		return;
	}

	filterButtons.forEach((button) => {
		button.addEventListener('click', () => {
			const selected = button.getAttribute('data-filter-service');

			filterButtons.forEach((btn) => {
				btn.classList.toggle('is-active', btn === button);
			});

			listItems.forEach((item) => {
				const types = item.getAttribute('data-service-types').split(',');
				const shouldShow = selected === 'all' || types.includes(selected);
				item.style.display = shouldShow ? '' : 'none';
			});
		});
	});
})();
