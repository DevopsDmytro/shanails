<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { getMonthlyAvailability } from '$lib/api';
	import type { Master } from '$lib/api';

	export let selectedMaster: Master | null = null;
	export let selectedDate: string = '';

	const dispatch = createEventDispatcher();

	let currentMonth: Date = new Date();
	let availableDates: string[] = [];
	let loading = false;
	let error: string | null = null;

	// Generate calendar days for current month
	$: calendarDays = generateCalendarDays(currentMonth);
	$: monthString = currentMonth.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' });

	onMount(() => {
		if (selectedMaster) {
			loadMonthlyAvailability();
		}
	});

	// Load monthly availability when master or month changes
	$: if (selectedMaster && currentMonth) {
		loadMonthlyAvailability();
	}

	async function loadMonthlyAvailability() {
		if (!selectedMaster) return;

		loading = true;
		error = null;

		try {
			const monthString = formatMonthForAPI(currentMonth);
			const response = await getMonthlyAvailability(selectedMaster.id, monthString);
			availableDates = response.available_dates;
		} catch (err) {
			error = 'Не вдалося завантажити доступні дати';
			console.error('Failed to load monthly availability:', err);
		} finally {
			loading = false;
		}
	}

	function formatMonthForAPI(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		return `${year}-${month}`;
	}

	function generateCalendarDays(date: Date): Array<{ date: number; isCurrentMonth: boolean; fullDate: string | null }> {
		const year = date.getFullYear();
		const month = date.getMonth();
		
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startDate = new Date(firstDay);
		startDate.setDate(startDate.getDate() - firstDay.getDay());
		
		const days = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = 0; i < 42; i++) {
			const currentDate = new Date(startDate);
			currentDate.setDate(startDate.getDate() + i);
			
			const isCurrentMonth = currentDate.getMonth() === month;
			const dayNumber = currentDate.getDate();
			const fullDate = currentDate.toISOString().split('T')[0];
			
			// Don't allow past dates
			const isPast = currentDate < today;
			
			days.push({
				date: dayNumber,
				isCurrentMonth,
				fullDate: isPast ? null : fullDate
			});
		}

		return days;
	}

	function isDateAvailable(dateString: string): boolean {
		return availableDates.includes(dateString);
	}

	function isDateSelected(dateString: string): boolean {
		return selectedDate === dateString;
	}

	function selectDate(dateString: string) {
		if (dateString && isDateAvailable(dateString)) {
			selectedDate = dateString;
			dispatch('select', dateString);
		}
	}

	function previousMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
	}

	const weekDays = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
</script>

<div class="calendar-picker">
	<h2>Оберіть дату</h2>
	
	{#if !selectedMaster}
		<div class="no-master">
			<p>Спочатку оберіть майстра</p>
		</div>
	{:else if loading}
		<div class="loading">Завантаження календаря...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<div class="calendar-container">
			<!-- Month navigation -->
			<div class="month-navigation">
				<button class="nav-btn" on:click={previousMonth} disabled={loading}>
					←
				</button>
				<h3>{monthString}</h3>
				<button class="nav-btn" on:click={nextMonth} disabled={loading}>
					→
				</button>
			</div>

			<!-- Calendar grid -->
			<div class="calendar-grid">
				<!-- Week day headers -->
				{#each weekDays as day}
					<div class="day-header">{day}</div>
				{/each}

				<!-- Calendar days -->
				{#each calendarDays as day (day.fullDate || `${day.date}-${day.isCurrentMonth}`)}
					<button
						class="calendar-day"
						class:current-month={day.isCurrentMonth}
						class:other-month={!day.isCurrentMonth}
						class:available={day.fullDate && isDateAvailable(day.fullDate)}
						class:selected={day.fullDate && isDateSelected(day.fullDate)}
						class:disabled={!day.fullDate || !isDateAvailable(day.fullDate)}
						on:click={() => selectDate(day.fullDate || '')}
						disabled={!day.fullDate || !isDateAvailable(day.fullDate)}
					>
						{day.date}
					</button>
				{/each}
			</div>

			<!-- Legend -->
			<div class="legend">
				<div class="legend-item">
					<div class="legend-dot available"></div>
					<span>Доступні дати</span>
				</div>
				<div class="legend-item">
					<div class="legend-dot selected"></div>
					<span>Обрана дата</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.calendar-picker {
		margin-bottom: 30px;
	}

	.calendar-picker h2 {
		margin-bottom: 20px;
		color: #333;
		font-size: 1.5rem;
	}

	.no-master, .loading, .error {
		text-align: center;
		padding: 40px 20px;
		color: #666;
	}

	.error {
		background-color: #f8d7da;
		color: #721c24;
		border-radius: 8px;
		border: 1px solid #f5c6cb;
	}

	.calendar-container {
		background: white;
		border-radius: 12px;
		padding: 20px;
		border: 1px solid #e9ecef;
	}

	.month-navigation {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.nav-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 5px 10px;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.nav-btn:hover:not(:disabled) {
		background-color: #f0f0f0;
	}

	.nav-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.month-navigation h3 {
		margin: 0;
		color: #333;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
		margin-bottom: 20px;
	}

	.day-header {
		text-align: center;
		font-weight: 600;
		color: #666;
		padding: 10px 5px;
		font-size: 0.9rem;
	}

	.calendar-day {
		aspect-ratio: 1;
		border: 1px solid #e9ecef;
		background: white;
		cursor: pointer;
		border-radius: 6px;
		font-weight: 500;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.95rem;
	}

	.calendar-day:hover:not(:disabled) {
		background-color: #f8f9ff;
		border-color: #007bff;
	}

	.calendar-day.other-month {
		color: #ccc;
		background-color: #f8f9fa;
	}

	.calendar-day.available {
		background-color: #e7f3ff;
		border-color: #007bff;
		color: #007bff;
		font-weight: 600;
	}

	.calendar-day.selected {
		background-color: #007bff;
		border-color: #007bff;
		color: white;
	}

	.calendar-day.disabled {
		color: #ccc;
		background-color: #f8f9fa;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.legend {
		display: flex;
		justify-content: center;
		gap: 20px;
		font-size: 0.9rem;
		color: #666;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.legend-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1px solid #e9ecef;
	}

	.legend-dot.available {
		background-color: #e7f3ff;
		border-color: #007bff;
	}

	.legend-dot.selected {
		background-color: #007bff;
		border-color: #007bff;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.calendar-container {
			padding: 15px;
		}

		.calendar-grid {
			gap: 1px;
		}

		.day-header {
			padding: 8px 3px;
			font-size: 0.8rem;
		}

		.calendar-day {
			font-size: 0.85rem;
		}

		.legend {
			flex-direction: column;
			gap: 10px;
			align-items: center;
		}

		.month-navigation h3 {
			font-size: 1.1rem;
		}
	}

	@media (max-width: 480px) {
		.calendar-day {
			font-size: 0.75rem;
		}

		.day-header {
			font-size: 0.75rem;
			padding: 6px 2px;
		}
	}
</style>