<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let selectedDate: string = '';
	export let selectedTime: string = '';
	export let availableSlots: string[] = [];
	export let loading: boolean = false;

	const dispatch = createEventDispatcher();

	function selectTime(time: string) {
		selectedTime = time;
		dispatch('select', time);
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString + 'T00:00:00');
		return date.toLocaleDateString('uk-UA', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="time-slot-picker">
	<h2>Оберіть час</h2>
	
	{#if !selectedDate}
		<div class="no-date">
			<p>Спочатку оберіть дату</p>
		</div>
	{:else if loading}
		<div class="loading">Перевірка доступності...</div>
	{:else if availableSlots.length > 0}
		<div class="date-info">
			<p>📅 {formatDate(selectedDate)}</p>
		</div>
		
		<div class="time-slots">
			{#each availableSlots as slot}
				<button
					class="time-slot"
					class:selected={selectedTime === slot}
					on:click={() => selectTime(slot)}
				>
					{slot}
				</button>
			{/each}
		</div>
	{:else if selectedDate}
		<div class="no-slots">
			<p>На жаль, на цю дату немає вільних слотів.</p>
			<p>Будь ласка, оберіть іншу дату.</p>
		</div>
	{:else}
		<div class="checking">
			<p>Перевіряємо доступність...</p>
		</div>
	{/if}
</div>

<style>
	.time-slot-picker {
		margin-bottom: 30px;
	}

	.time-slot-picker h2 {
		margin-bottom: 20px;
		color: #333;
		font-size: 1.5rem;
	}

	.no-date, .loading, .no-slots, .checking {
		text-align: center;
		padding: 40px 20px;
		color: #666;
	}

	.no-slots {
		background-color: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 8px;
		color: #856404;
	}

	.date-info {
		background-color: #f8f9fa;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 20px;
		text-align: center;
	}

	.date-info p {
		margin: 0;
		font-size: 1.1rem;
		color: #333;
		font-weight: 500;
	}

	.time-slots {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 12px;
	}

	.time-slot {
		padding: 15px 20px;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		background-color: white;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		font-size: 1rem;
		text-align: center;
	}

	.time-slot:hover {
		border-color: #007bff;
		background-color: #f8f9ff;
		transform: translateY(-1px);
	}

	.time-slot.selected {
		border-color: #007bff;
		background-color: #007bff;
		color: white;
		transform: scale(1.05);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.time-slots {
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
			gap: 8px;
		}
		
		.time-slot {
			padding: 12px 16px;
			font-size: 0.9rem;
		}
	}

	@media (max-width: 480px) {
		.time-slots {
			grid-template-columns: repeat(3, 1fr);
		}
		
		.time-slot {
			padding: 10px 12px;
			font-size: 0.85rem;
		}
	}
</style>