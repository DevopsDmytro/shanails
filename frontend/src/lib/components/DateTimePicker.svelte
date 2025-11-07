<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { getMonthlyAvailability, getAvailability } from '$lib/api';
	import type { Master } from '$lib/api';

	export let selectedMaster: Master | null = null;
	export let selectedDate: string = '';
	export let selectedTime: string = '';
	export let availableSlots: string[] = [];
	export let loadingAvailability: boolean = false;

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

	async function handleDateSelect(dateString: string) {
		if (!isDateAvailable(dateString)) return;

		selectedDate = dateString;
		selectedTime = ''; // Reset time when date changes
		await loadTimeSlots();
		dispatch('dateSelect', dateString);
	}

	async function loadTimeSlots() {
		if (!selectedMaster || !selectedDate) return;

		loadingAvailability = true;
		availableSlots = [];

		try {
			const response = await getAvailability(selectedMaster.id, selectedDate);
			availableSlots = response.available_slots;
		} catch (err) {
			console.error('Failed to load time slots:', err);
		} finally {
			loadingAvailability = false;
		}
	}

	function handleTimeSelect(time: string) {
		selectedTime = time;
		dispatch('timeSelect', time);
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

	function previousMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
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

	const weekDays = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
</script>

<div class="datetime-picker">
	<h2>Оберіть дату та час</h2>
	
	{#if !selectedMaster}
		<div class="no-master">
			<p>Спочатку оберіть майстра</p>
		</div>
	{:else if loading}
		<div class="loading">Завантаження календаря...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<div class="datetime-container">
			<!-- Calendar section -->
			<div class="calendar-section">
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
							on:click={() => handleDateSelect(day.fullDate || '')}
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

			<!-- Time slots section -->
			{#if selectedDate}
				<div class="time-section">
					<div class="selected-date-info">
						<p>📅 {formatDate(selectedDate)}</p>
					</div>
					
					{#if loadingAvailability}
						<div class="loading-time">Перевірка доступності...</div>
					{:else if availableSlots.length > 0}
						<div class="time-slots">
							{#each availableSlots as slot}
								<button
									class="time-slot"
									class:selected={selectedTime === slot}
									on:click={() => handleTimeSelect(slot)}
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
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.datetime-picker {
		margin-bottom: 30px;
	}

	.datetime-picker h2 {
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

	.datetime-container {
		display: grid;
		grid-template-columns: 1fr;
		gap: 30px;
	}

	.calendar-section {
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

	.time-section {
		background: white;
		border-radius: 12px;
		padding: 20px;
		border: 1px solid #e9ecef;
	}

	.selected-date-info {
		background-color: #f8f9fa;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 20px;
		text-align: center;
	}

	.selected-date-info p {
		margin: 0;
		font-size: 1.1rem;
		color: #333;
		font-weight: 500;
	}

	.loading-time {
		text-align: center;
		padding: 20px;
		color: #666;
		font-style: italic;
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

	.no-slots {
		text-align: center;
		padding: 30px;
		background-color: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 8px;
		color: #856404;
	}

	.no-slots p {
		margin: 5px 0;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.calendar-section {
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

		.time-section {
			padding: 15px;
		}

		.time-slots {
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
			gap: 8px;
		}
		
		.time-slot {
			padding: 12px 16px;
			font-size: 0.9rem;
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

		.time-slots {
			grid-template-columns: repeat(3, 1fr);
		}
		
		.time-slot {
			padding: 10px 12px;
			font-size: 0.85rem;
		}
	}
</style>