// API types and utilities for the salon booking system

export interface User {
	id: number;
	telegram_id: number | null;
	name: string;
	phone: string | null;
	role: string;
	is_registered: boolean;
}

export interface Master {
	id: number;
	user_id: number;
	name?: string;
	specialization?: string;
	description?: string;
	photo_url?: string;
	is_active: boolean;
	created_at: string;
}

export interface Service {
	id: number;
	name: string;
	description?: string;
	category?: string;
	duration: number; // Backend uses 'duration' not 'duration_minutes'
	duration_minutes?: number; // Keep for compatibility
	price: number;
	is_active: boolean;
	created_at: string;
}

export interface AvailabilityResponse {
	date: string;
	available_slots: string[];
	master: Master;
}

export interface MonthlyAvailabilityResponse {
	available_dates: string[];
}

export interface CreateAppointmentRequest {
	master_id: number;
	service_ids: number[]; // Backend expects array of service_ids
	start_time: string;
	notes?: string;
}

export interface Appointment {
	id: number;
	client: {
		id: number;
		email: string;
		full_name: string;
		phone?: string;
	};
	master: Master;
	service: Service;
	start_time: string;
	end_time: string;
	status: string;
	total_price: number;
	total_duration_minutes: number;
	notes?: string;
	created_at: string;
	updated_at: string;
}

export interface TelegramAuthResponse {
	user: User;
	token: string | null;
	needs_registration: boolean;
}

export interface RegisterRequest {
	name: string;
	phone: string;
}

export interface RegisterResponse {
	user: User;
	token: string;
	needs_registration: boolean;
}

import { browser } from '$app/environment';

// Base API configuration
const API_BASE_URL = browser ? '/api/v1' : 'http://backend:8000/api/v1';

// Generic API request function
async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;

	const config: RequestInit = {
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
		...options,
	};

	try {
		const response = await fetch(url, config);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`
			);
		}

		return await response.json();
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error('Network error occurred');
	}
}

// Masters API
export async function getMasters(): Promise<Master[]> {
	return apiRequest<Master[]>('/masters/');
}

export async function getMaster(id: number): Promise<Master> {
	return apiRequest<Master>(`/masters/${id}`);
}

export async function getAvailability(
	masterId: number,
	date: string
): Promise<AvailabilityResponse> {
	return apiRequest<AvailabilityResponse>(
		`/masters/${masterId}/availability?date=${date}`
	);
}

export async function getMonthlyAvailability(
	masterId: number,
	month: string
): Promise<MonthlyAvailabilityResponse> {
	return apiRequest<MonthlyAvailabilityResponse>(
		`/masters/${masterId}/availability-month?month=${month}`
	);
}

// Services API
export async function getServices(): Promise<Service[]> {
	const response = await apiRequest<Service[]>('/services/');
	return response;
}

export async function getService(id: number): Promise<Service> {
	return apiRequest<Service>(`/services/${id}`);
}

// Appointments API
export async function createAppointment(
	data: CreateAppointmentRequest
): Promise<Appointment> {
	return apiRequest<Appointment>('/appointments/', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function getAppointment(id: number): Promise<Appointment> {
	return apiRequest<Appointment>(`/appointments/${id}`);
}

export async function getAppointments(params?: {
	status?: string;
	from_date?: string;
	to_date?: string;
}): Promise<{ appointments: Appointment[]; total: number; page: number; limit: number }> {
	const searchParams = new URLSearchParams();
	if (params?.status) searchParams.append('status', params.status);
	if (params?.from_date) searchParams.append('from_date', params.from_date);
	if (params?.to_date) searchParams.append('to_date', params.to_date);

	const query = searchParams.toString();
	return apiRequest(`/appointments/${query ? `?${query}` : ''}`);
}

export async function cancelAppointment(id: number): Promise<Appointment> {
	return apiRequest<Appointment>(`/appointments/${id}`, {
		method: 'DELETE',
	});
}

// Authentication API
export async function telegramAuth(initData: string): Promise<TelegramAuthResponse> {
	return apiRequest<TelegramAuthResponse>('/auth/telegram/init', {
		method: 'POST',
		body: JSON.stringify({ init_data: initData }),
	});
}

export async function register(
	telegramId: number,
	name: string,
	phone: string
): Promise<RegisterResponse> {
	return apiRequest<RegisterResponse>(`/auth/register?telegram_id=${telegramId}`, {
		method: 'POST',
		body: JSON.stringify({ name, phone }),
	});
}

export async function getCurrentUser(token: string): Promise<User> {
	return apiRequest<User>('/auth/me', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
}