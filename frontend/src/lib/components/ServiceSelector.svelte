<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { getServices, type Service } from '$lib/api';

	export let selectedServices: Service[] = [];

	const dispatch = createEventDispatcher();

	let services: Service[] = [];
	let loading = true;
	let error: string | null = null;
	let searchQuery = '';
	let openCategory: string | null = null;

	const MAX_DURATION_MINUTES = 120;
	const MAX_SERVICES_COUNT = 3;

	onMount(async () => {
		try {
			loading = true;
			const response = await getServices();
			services = response as Service[];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не вдалося завантажити список послуг';
		} finally {
			loading = false;
		}
	});

	// Group services by category
	$: servicesByCategory = services.reduce((acc, service: Service) => {
		const category = service.category || 'Інші';
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push(service);
		return acc;
	}, {} as Record<string, Service[]>);

	// Simple filtering without complex reactive logic for now
	$: filteredServicesByCategory = servicesByCategory;

	// Calculate total duration of selected services
	$: totalDuration = selectedServices.reduce((sum, service: Service) => sum + (service.duration || service.duration_minutes || 0), 0);

	// Calculate total price of selected services
	$: totalPrice = selectedServices.reduce((sum, service: Service) => sum + service.price, 0);

	// Check if duration exceeds limit
	$: durationExceedsLimit = totalDuration > MAX_DURATION_MINUTES;

	// Check if service count exceeds limit
	$: serviceCountExceedsLimit = selectedServices.length > MAX_SERVICES_COUNT;

	// Check if a service is selected
	function isServiceSelected(service: Service): boolean {
		return selectedServices.some((s: Service) => s.id === service.id);
	}

	// Check if any service in a category is selected
	function isCategorySelected(category: string): boolean {
		const servicesInCategory = filteredServicesByCategory[category];
		if (!servicesInCategory) return false;
		
		const categoryServiceIds = servicesInCategory.map(s => s.id);
		return selectedServices.some(selected => categoryServiceIds.includes(selected.id));
	}

	// Add service with immediate accordion collapse
	function addService(service: Service) {
		if (selectedServices.length < MAX_SERVICES_COUNT && !isServiceSelected(service)) {
			selectedServices = [...selectedServices, service];
			dispatch('select', selectedServices);
			// Immediately collapse accordion after adding service
			openCategory = null;
		}
	}

	// Remove service with immediate accordion collapse
	function removeService(service: Service) {
		selectedServices = selectedServices.filter((s: Service) => s.id !== service.id);
		dispatch('select', selectedServices);
		// Immediately collapse accordion after removing service
		openCategory = null;
	}

	// Toggle category expansion (single open category)
	function toggleCategory(category: string) {
		if (openCategory === category) {
			openCategory = null;
		} else {
			openCategory = category;
		}
	}

	// Format duration for display
	function formatDuration(minutes: number): string {
		if (minutes < 60) {
			return `${minutes} хв`;
		} else {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return remainingMinutes > 0 
				? `${hours} год ${remainingMinutes} хв`
				: `${hours} год`;
		}
	}

	// Format price for display
	function formatPrice(price: number): string {
		return `${price.toFixed(2)} грн`;
	}
</script>

<div class="service-selector">
	<h2>Оберіть послуги (до {MAX_SERVICES_COUNT})</h2>
	
	{#if loading}
		<div class="loading">Завантаження послуг...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if services.length === 0}
		<div class="empty">На жаль, доступних послуг не знайдено</div>
	{:else}
		<!-- Search input -->
		<div class="search-section">
			<label for="service-search" class="search-label">Пошук послуг:</label>
			<input
				id="service-search"
				type="text"
				placeholder="Введіть назву послуги..."
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>

		<!-- Accordion-style categories -->
		<div class="categories-accordion">
			{#each Object.entries(filteredServicesByCategory) as [category, categoryServices] (category)}
				<div class="category-section">
					<button
						class="category-header"
						class:expanded={openCategory === category}
						class:selected={isCategorySelected(category)}
						on:click={() => toggleCategory(category)}
					>
						<span class="category-title">{category}</span>
						<span class="category-count">({categoryServices.length})</span>
						<span class="expand-icon">{openCategory === category ? '−' : '+'}</span>
					</button>
					
					{#if openCategory === category}
						<div class="category-content">
							{#each categoryServices as service (service.id)}
								<div
									class="service-item"
									class:selected={isServiceSelected(service)}
									class:disabled={!isServiceSelected(service) && selectedServices.length >= MAX_SERVICES_COUNT}
								>
									<div class="service-info">
										<h3 class="service-name">{service.name}</h3>
										{#if service.description}
											<p class="service-description">{service.description}</p>
										{/if}
										<div class="service-meta">
											<span class="service-duration">{formatDuration(service.duration || service.duration_minutes || 0)}</span>
											<span class="service-price">{formatPrice(service.price)}</span>
										</div>
									</div>
									
									{#if isServiceSelected(service)}
										<button 
											class="remove-btn" 
											on:click={() => removeService(service)}
											aria-label={`Видалити ${service.name}`}
										>
											−
										</button>
									{:else}
										<button 
											class="add-btn" 
											on:click={() => addService(service)}
											disabled={selectedServices.length >= MAX_SERVICES_COUNT}
											aria-label={`Додати ${service.name}`}
										>
											+
										</button>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if Object.keys(filteredServicesByCategory).length === 0 && searchQuery}
			<div class="no-results">
				<p>Послуги за запитом "{searchQuery}" не знайдено</p>
			</div>
		{/if}

		<!-- Selection summary -->
		{#if selectedServices.length > 0}
			<div class="selection-summary">
				<h3>Обрані послуги ({selectedServices.length}/{MAX_SERVICES_COUNT}):</h3>
				<ul class="selected-services">
					{#each selectedServices as service}
						<li class="selected-service">
							<span class="service-name">{service.name}</span>
							<span class="service-details">
								{formatDuration(service.duration || service.duration_minutes || 0)} - {formatPrice(service.price)}
							</span>
						</li>
					{/each}
				</ul>
				
				<div class="totals">
					<div class="total-duration">
						<strong>Загальна тривалість:</strong> 
						<span class:warning={durationExceedsLimit}>
							{formatDuration(totalDuration)}
						</span>
					</div>
					<div class="total-price">
						<strong>Загальна вартість:</strong> {formatPrice(totalPrice)}
					</div>
				</div>

				{#if durationExceedsLimit}
					<div class="duration-warning">
						⚠️ Увага! Загальна тривалість перевищує {formatDuration(MAX_DURATION_MINUTES)}.
						Будь ласка, скоротіть кількість обраних послуг.
					</div>
				{/if}

				{#if serviceCountExceedsLimit}
					<div class="count-warning">
						⚠️ Досягнуто максимальної кількості послуг ({MAX_SERVICES_COUNT}).
					</div>
				{/if}
			</div>
		{:else}
			<div class="empty-selection">
				<p>Оберіть до {MAX_SERVICES_COUNT} послуг для продовження</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.service-selector {
		margin-bottom: 30px;
	}

	.service-selector h2 {
		margin-bottom: 20px;
		color: #333;
		font-size: 1.5rem;
	}

	.loading {
		text-align: center;
		padding: 20px;
		color: #666;
		font-style: italic;
	}

	.error {
		background-color: #f8d7da;
		color: #721c24;
		padding: 12px;
		border-radius: 6px;
		margin: 15px 0;
		border: 1px solid #f5c6cb;
	}

	.empty {
		text-align: center;
		padding: 20px;
		color: #666;
		background-color: #f8f9fa;
		border-radius: 6px;
	}

	.search-section {
		margin-bottom: 25px;
	}

	.search-label {
		display: block;
		margin-bottom: 8px;
		font-weight: 600;
		color: #333;
	}

	.search-input {
		width: 100%;
		padding: 12px 16px;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}



	.service-item {
		display: flex;
		align-items: flex-start;
		padding: 16px;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		margin-bottom: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		background-color: white;
	}

	.service-item:hover {
		border-color: #007bff;
		background-color: #f8f9ff;
	}

	.service-item.selected {
		border-color: #007bff;
		background-color: #e7f3ff;
	}

	.service-item:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}

	.service-info {
		flex: 1;
	}

	.add-btn, .remove-btn {
		padding: 8px 16px;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
		min-width: 50px;
		text-align: center;
	}

	.add-btn {
		background-color: #28a745;
		color: white;
		font-size: 1.2rem;
		line-height: 1;
		padding: 8px 12px;
	}

	.add-btn:hover:not(:disabled) {
		background-color: #218838;
		transform: scale(1.05);
	}

	.add-btn:disabled {
		background-color: #6c757d;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.remove-btn {
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		font-size: 1.5rem;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.remove-btn:hover {
		background-color: #0056b3;
		transform: scale(1.1);
	}

	.service-name {
		margin: 0 0 8px 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
	}

	.service-description {
		margin: 0 0 10px 0;
		color: #666;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.service-meta {
		display: flex;
		gap: 15px;
		flex-wrap: wrap;
		font-size: 0.85rem;
	}



	.service-duration {
		color: #007bff;
		font-weight: 500;
	}

	.service-price {
		color: #28a745;
		font-weight: 600;
	}

	.no-results {
		text-align: center;
		padding: 20px;
		color: #666;
		font-style: italic;
	}

	.selection-summary {
		background-color: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 20px;
	}

	.selection-summary h3 {
		margin: 0 0 15px 0;
		color: #333;
		font-size: 1.2rem;
	}

	.selected-services {
		list-style: none;
		padding: 0;
		margin: 0 0 15px 0;
	}

	.selected-service {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #dee2e6;
	}

	.selected-service:last-child {
		border-bottom: none;
	}

	.selected-service .service-name {
		font-weight: 500;
		margin: 0;
	}

	.service-details {
		color: #666;
		font-size: 0.9rem;
	}

	.totals {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 15px;
		border-top: 2px solid #dee2e6;
		margin-bottom: 15px;
	}

	.total-duration, .total-price {
		font-size: 1.1rem;
	}

	.total-duration .warning {
		color: #dc3545;
		font-weight: 600;
	}

	.duration-warning {
		background-color: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 6px;
		padding: 12px;
		color: #856404;
		font-weight: 500;
	}

	.categories-accordion {
		margin-bottom: 25px;
	}

	.category-section {
		margin-bottom: 15px;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		overflow: hidden;
	}

	.category-header {
		width: 100%;
		background-color: #f8f9fa;
		border: none;
		padding: 15px 20px;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 600;
		color: #333;
		transition: background-color 0.2s ease;
	}

	.category-header:hover {
		background-color: #e9ecef;
	}

	.category-header.expanded {
		background-color: #007bff;
		color: white;
	}

	.category-header.selected {
		background-color: #e0e8ff;
		border: 1px solid #007bff;
	}

	.category-title {
		flex: 1;
		text-align: left;
	}

	.category-count {
		color: #6c757d;
		font-size: 0.9rem;
		margin-right: 10px;
	}

	.category-header.expanded .category-count {
		color: rgba(255, 255, 255, 0.8);
	}

	.expand-icon {
		font-size: 1.2rem;
		font-weight: bold;
		width: 24px;
		text-align: center;
	}

	.category-content {
		background-color: white;
		border-top: 1px solid #e9ecef;
	}

	.service-item.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.service-item.disabled:hover {
		border-color: #e9ecef;
		background-color: white;
	}

	.empty-selection {
		text-align: center;
		padding: 20px;
		color: #6c757d;
		background-color: #f8f9fa;
		border-radius: 8px;
		font-style: italic;
	}

	.count-warning {
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 6px;
		padding: 12px;
		color: #721c24;
		font-weight: 500;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.service-item {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}
		
		.add-btn, .remove-btn {
			align-self: flex-end;
			margin-top: 8px;
		}
		
		.service-meta {
			flex-direction: column;
			gap: 5px;
		}
		
		.totals {
			flex-direction: column;
			align-items: stretch;
			gap: 10px;
		}
		
		.selected-service {
			flex-direction: column;
			align-items: stretch;
			gap: 5px;
		}
	}
</style>