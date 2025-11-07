<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import MasterSelector from './MasterSelector.svelte';
	import DateTimePicker from './DateTimePicker.svelte';
	import ServiceSelector from './ServiceSelector.svelte';
	import { getAvailability } from '$lib/api';
	import type { Master, Service } from '$lib/api';

	const dispatch = createEventDispatcher();

	export let bookingError: string | null = null;

	// Steps: 1 = Master, 2 = DateTime, 3 = Services, 4 = Confirmation
	let currentStep = 1;
	const totalSteps = 4;

	let selectedMaster: Master | null = null;
	let selectedDate: string = '';
	let selectedTime: string = '';
	let selectedServices: Service[] = [];
	let availableSlots: string[] = [];
	let loadingAvailability = false;

	// Step navigation
	function nextStep() {
		if (currentStep < totalSteps) {
			console.log('Transitioning from step', currentStep, 'to step', currentStep + 1);
			currentStep++;
			console.log('Current step is now:', currentStep);
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	function goToStep(step: number) {
		if (step >= 1 && step <= totalSteps) {
			currentStep = step;
		}
	}

	// Master selection
	function handleMasterSelect(master: Master) {
		selectedMaster = master;
		// Reset dependent selections
		selectedDate = '';
		selectedTime = '';
		availableSlots = [];
	}

	// Date selection
	async function handleDateSelect(date: string) {
		selectedDate = date;
		selectedTime = '';
		await loadTimeSlots();
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

	// Time selection
	function handleTimeSelect(time: string) {
		selectedTime = time;
	}

	// Service selection
	function handleServicesSelect(services: Service[]) {
		selectedServices = services;
	}

	// Validation
	$: canProceedFromMaster = selectedMaster !== null;
	$: canProceedFromDateTime = selectedDate !== '' && selectedTime !== '';
	$: canProceedFromServices = selectedServices.length > 0 && selectedServices.length <= 3;

	// Calculate totals
	$: totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration || service.duration_minutes || 0), 0);
	$: totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
	$: durationExceedsLimit = totalDuration > 120;

	// Final confirmation
	function confirmBooking() {
		if (!selectedMaster || !selectedDate || !selectedTime || selectedServices.length === 0) {
			return;
		}

		dispatch('confirm', {
			master: selectedMaster,
			services: selectedServices,
			date: selectedDate,
			time: selectedTime
		});
	}



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

	function formatPrice(price: number): string {
		return `${price.toFixed(2)} грн`;
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

<div class="multi-step-booking">
	<!-- Progress indicator -->
	<div class="progress-indicator">
		<div class="progress-bar">
			<div 
				class="progress-fill" 
				style="width: {((currentStep - 1) / (totalSteps - 1)) * 100}%"
			></div>
		</div>
		<div class="step-dots">
			{#each Array(totalSteps) as _, i}
				<button
					class="step-dot"
					class:active={currentStep === i + 1}
					class:completed={i + 1 < currentStep}
					on:click={() => goToStep(i + 1)}
					disabled={i + 1 > currentStep}
				>
					{i + 1}
				</button>
			{/each}
		</div>
	</div>

	<!-- Step content -->
	<div class="step-content">
		{#if currentStep === 1}
			<div class="step-master">
				<MasterSelector 
					{selectedMaster} 
					on:select={(e) => handleMasterSelect(e.detail)}
				/>
			</div>
		{:else if currentStep === 2}
			<div class="step-datetime">
				<DateTimePicker 
					{selectedMaster}
					{selectedDate}
					{selectedTime}
					{availableSlots}
					{loadingAvailability}
					on:dateSelect={(e) => handleDateSelect(e.detail)}
					on:timeSelect={(e) => handleTimeSelect(e.detail)}
				/>
			</div>
		{:else if currentStep === 3}
			<div class="step-services">
				<ServiceSelector 
					{selectedServices}
					on:select={(e) => handleServicesSelect(e.detail)}
				/>
				
				{#if durationExceedsLimit}
					<div class="duration-warning">
						⚠️ Загальна тривалість перевищує 120 хвилин. Будь ласка, скоротіть кількість обраних послуг.
					</div>
				{/if}
			</div>
		{:else if currentStep === 4}
			<div class="step-confirmation">
				<h2>Підтвердження запису</h2>
				
				<div class="confirmation-details">
					<div class="detail-section">
						<h3>👤 Майстер</h3>
						<p>{selectedMaster?.name}</p>
					</div>
					
					<div class="detail-section">
						<h3>📅 Дата та час</h3>
						<p>{formatDate(selectedDate)}</p>
						<p>⏰ {selectedTime}</p>
					</div>
					
					<div class="detail-section">
						<h3>💅 Послуги ({selectedServices.length})</h3>
						<ul>
							{#each selectedServices as service}
								<li>
									{service.name} - {formatDuration(service.duration || service.duration_minutes || 0)} - {formatPrice(service.price)}
								</li>
							{/each}
						</ul>
					</div>
					
					<div class="detail-section totals">
						<div class="total-row">
							<span>Загальна тривалість:</span>
							<strong>{formatDuration(totalDuration)}</strong>
						</div>
						<div class="total-row">
							<span>Загальна вартість:</span>
							<strong>{formatPrice(totalPrice)}</strong>
						</div>
					</div>
				</div>
				
				{#if bookingError}
					<div class="error">{bookingError}</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Navigation buttons -->
	<div class="navigation">
		{#if currentStep > 1}
			<button class="btn secondary" on:click={prevStep}>
				← Назад
			</button>
		{/if}
		
		{#if currentStep < totalSteps}
			<button 
				class="btn primary" 
				on:click={nextStep}
				disabled={
					(currentStep === 1 && !canProceedFromMaster) ||
					(currentStep === 2 && !canProceedFromDateTime) ||
					(currentStep === 3 && (!canProceedFromServices || durationExceedsLimit))
				}
			>
				Далі →
			</button>
		{:else}
			<button 
				class="btn primary confirm" 
				on:click={confirmBooking}
				disabled={durationExceedsLimit}
			>
				Підтвердити запис
			</button>
		{/if}
	</div>
</div>

<style>
	.multi-step-booking {
		max-width: 600px;
		margin: 0 auto;
	}

	.progress-indicator {
		margin-bottom: 30px;
		position: sticky;
		top: 0;
		background-color: white;
		z-index: 10;
		padding: 1rem 0;
		border-bottom: 1px solid #e9ecef;
	}

	.progress-bar {
		height: 4px;
		background-color: #e9ecef;
		border-radius: 2px;
		margin-bottom: 20px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: #007bff;
		transition: width 0.3s ease;
	}

	.step-dots {
		display: flex;
		justify-content: space-between;
		margin-bottom: 15px;
	}

	.step-dot {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 2px solid #e9ecef;
		background-color: white;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.step-dot:hover:not(:disabled) {
		border-color: #007bff;
	}

	.step-dot.active {
		background-color: #007bff;
		color: white;
		border-color: #007bff;
	}

	.step-dot.completed {
		background-color: #28a745;
		color: white;
		border-color: #28a745;
	}

	.step-dot:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}



	.step-content {
		min-height: 400px;
		margin-bottom: 30px;
	}

	.step-master,
	.step-datetime,
	.step-services,
	.step-confirmation {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.step-confirmation h2 {
		margin-bottom: 25px;
		color: #333;
		text-align: center;
	}

	.confirmation-details {
		background-color: #f8f9fa;
		border-radius: 12px;
		padding: 25px;
		margin-bottom: 20px;
	}

	.detail-section {
		margin-bottom: 20px;
	}

	.detail-section:last-child {
		margin-bottom: 0;
	}

	.detail-section h3 {
		margin: 0 0 10px 0;
		color: #333;
		font-size: 1.1rem;
	}

	.detail-section p {
		margin: 5px 0;
		color: #666;
	}

	.detail-section ul {
		list-style: none;
		padding: 0;
		margin: 10px 0;
	}

	.detail-section li {
		padding: 8px 0;
		border-bottom: 1px solid #dee2e6;
		color: #666;
	}

	.detail-section li:last-child {
		border-bottom: none;
	}

	.totals {
		background-color: white;
		border: 2px solid #007bff;
		border-radius: 8px;
		padding: 20px;
		margin-top: 20px;
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		font-size: 1.1rem;
	}

	.total-row:last-child {
		margin-bottom: 0;
		font-size: 1.2rem;
		color: #007bff;
	}

	.navigation {
		display: flex;
		justify-content: space-between;
		gap: 15px;
	}

	.btn {
		flex: 1;
		padding: 15px 20px;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn.primary {
		background-color: #007bff;
		color: white;
	}

	.btn.primary:hover:not(:disabled) {
		background-color: #0056b3;
	}

	.btn.secondary {
		background-color: #6c757d;
		color: white;
	}

	.btn.secondary:hover:not(:disabled) {
		background-color: #545b62;
	}

	.btn.confirm {
		background-color: #28a745;
	}

	.btn.confirm:hover:not(:disabled) {
		background-color: #218838;
	}

	.duration-warning {
		background-color: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 6px;
		padding: 12px;
		color: #856404;
		margin: 15px 0;
		font-weight: 500;
	}

	.error {
		background-color: #f8d7da;
		color: #721c24;
		padding: 12px;
		border-radius: 6px;
		margin: 15px 0;
		border: 1px solid #f5c6cb;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.step-dot {
			width: 35px;
			height: 35px;
			font-size: 0.9rem;
		}
		
		.navigation {
			flex-direction: column;
		}
		
		.btn {
			width: 100%;
		}
		
		.confirmation-details {
			padding: 20px;
		}
		
		.total-row {
			flex-direction: column;
			align-items: stretch;
			gap: 5px;
		}
	}
</style>