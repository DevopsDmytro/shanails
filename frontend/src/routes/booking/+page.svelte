<script lang="ts">
	import MultiStepBooking from '$lib/components/MultiStepBooking.svelte';
	import { createAppointment } from '$lib/api';
	import type { Master, Service } from '$lib/api';

	let bookingSuccess = false;
	let bookingData: {
		master: Master | null;
		services: Service[];
		date: string;
		time: string;
	} = {
		master: null,
		services: [],
		date: '',
		time: ''
	};
	let bookingError: string | null = null;

	async function confirmBooking(data: typeof bookingData) {
		bookingData = data;
		bookingError = null;

		try {
			const appointmentData = {
				master_id: data.master!.id,
				service_ids: data.services.map(s => s.id),
				start_time: `${data.date}T${data.time}:00`
			};

			const result = await createAppointment(appointmentData);
			console.log('Booking successful:', result);
			bookingSuccess = true;
		} catch (err) {
			bookingError = err instanceof Error ? err.message : 'Не вдалося створити запис';
			console.error(err);
		}
	}

	function resetBooking() {
		bookingSuccess = false;
		bookingData = {
			master: null,
			services: [],
			date: '',
			time: ''
		};
		bookingError = null;
	}
</script>

<div class="container">
	<div class="card">
		{#if bookingSuccess}
			<div class="success-message">
				<h2>✅ Запис успішно створено!</h2>
				<p>Ваш запис підтверджено на {bookingData.date} о {bookingData.time}</p>
				<p>Майстер: {bookingData.master?.name}</p>
				<p>Послуги: {bookingData.services.map(s => s.name).join(', ')}</p>
				<button on:click={resetBooking} class="btn">Створити новий запис</button>
				<a href="/" class="btn secondary">Повернутися на головну</a>
			</div>
		{:else}
			<MultiStepBooking 
				on:confirm={(e) => confirmBooking(e.detail)}
				{bookingError}
			/>
		{/if}
	</div>
</div>

<style>
	.success-message {
		text-align: center;
		padding: 20px;
	}

	.success-message h2 {
		color: #28a745;
		margin-bottom: 15px;
	}

	.success-message p {
		font-size: 18px;
		margin-bottom: 20px;
	}

	form {
		max-width: 500px;
		margin: 0 auto;
	}

	.btn {
		width: 100%;
		margin-top: 20px;
	}

	.btn.secondary {
		background-color: #6c757d;
		margin-top: 10px;
	}

	.btn.secondary:hover {
		background-color: #5a6268;
	}
</style>