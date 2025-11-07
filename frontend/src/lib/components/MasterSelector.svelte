<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { getMasters, type Master } from '$lib/api';

	export let selectedMaster: Master | null = null;

	const dispatch = createEventDispatcher();

	let masters: Master[] = [];
	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			loading = true;
			masters = await getMasters();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не вдалося завантажити список майстрів';
			console.error('Failed to load masters:', err);
		} finally {
			loading = false;
		}
	});

	function selectMaster(master: Master) {
		selectedMaster = master;
		dispatch('select', master);
	}
</script>

<div class="master-selector">
	<h2>Оберіть майстра</h2>
	
	{#if loading}
		<div class="loading">Завантаження майстрів...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if masters.length === 0}
		<div class="empty">На жаль, доступних майстрів не знайдено</div>
	{:else}
		<div class="masters-grid">
			{#each masters as master (master.id)}
				<button
					class="master-card"
					class:selected={selectedMaster?.id === master.id}
					on:click={() => selectMaster(master)}
					type="button"
				>
					{#if master.photo_url}
						<img src={master.photo_url} alt={master.name || `Майстер ${master.id}`} class="master-photo" />
					{/if}
					<div class="master-info">
						<h3 class="master-name">{master.name || `Майстер ${master.id}`}</h3>
						<p class="master-specialization">{master.specialization || 'Перукар'}</p>
						{#if master.description}
							<p class="master-description">{master.description}</p>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.master-selector {
		margin-bottom: 30px;
	}

	.master-selector h2 {
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

	.masters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 20px;
	}

	.master-card {
		background: white;
		border: 2px solid #e9ecef;
		border-radius: 12px;
		padding: 20px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 200px;
	}

	.master-card:hover {
		border-color: #007bff;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
	}

	.master-card.selected {
		border-color: #007bff;
		background-color: #e7f3ff;
		box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
	}

	.master-photo {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		margin-bottom: 15px;
		border: 3px solid #f0f0f0;
	}

	.master-info {
		text-align: center;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.master-name {
		margin: 0 0 8px 0;
		font-size: 1.2rem;
		font-weight: 600;
		color: #333;
	}

	.master-specialization {
		margin: 0 0 10px 0;
		color: #007bff;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.master-description {
		margin: 0;
		color: #666;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.masters-grid {
			grid-template-columns: 1fr;
		}
		
		.master-card {
			flex-direction: row;
			text-align: left;
			align-items: center;
			min-height: 120px;
		}
		
		.master-photo {
			margin-right: 15px;
			margin-bottom: 0;
			width: 60px;
			height: 60px;
		}
		
		.master-info {
			text-align: left;
		}
	}
</style>