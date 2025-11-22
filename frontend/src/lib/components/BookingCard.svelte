<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Appointment } from "$lib/api";
    import CancelModal from "./CancelModal.svelte";
    import RescheduleModal from "./RescheduleModal.svelte";

    export let appointment: Appointment;
    export let isPast = false;

    const dispatch = createEventDispatcher();

    let showCancelModal = false;
    let showRescheduleModal = false;

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("uk-UA", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    }

    function formatTime(dateString: string): string {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("uk-UA", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }

    function getStatusBadge(status: string): { text: string; class: string } {
        switch (status) {
            case "SCHEDULED":
                return { text: "Заплановано", class: "status-scheduled" };
            case "COMPLETED":
                return { text: "Завершено", class: "status-completed" };
            case "CANCELLED":
                return { text: "Скасовано", class: "status-cancelled" };
            default:
                return { text: status, class: "status-default" };
        }
    }

    const statusBadge = getStatusBadge(appointment.status);

    function handleCancelSuccess() {
        showCancelModal = false;
        dispatch("refresh");
    }

    function handleRescheduleSuccess() {
        showRescheduleModal = false;
        dispatch("refresh");
    }
</script>

<div class="booking-card">
    <div class="card-header">
        <span class="status-badge {statusBadge.class}">{statusBadge.text}</span>
        <span class="appointment-id">#{appointment.id}</span>
    </div>

    <div class="card-body">
        <div class="info-row">
            <span class="icon">👤</span>
            <div>
                <div class="label">Майстер</div>
                <div class="value">{appointment.master.name}</div>
            </div>
        </div>

        <div class="info-row">
            <span class="icon">📅</span>
            <div>
                <div class="label">Дата</div>
                <div class="value">{formatDate(appointment.start_time)}</div>
            </div>
        </div>

        <div class="info-row">
            <span class="icon">🕐</span>
            <div>
                <div class="label">Час</div>
                <div class="value">
                    {formatTime(appointment.start_time)} - {formatTime(
                        appointment.end_time,
                    )}
                </div>
            </div>
        </div>

        <div class="info-row">
            <span class="icon">✨</span>
            <div>
                <div class="label">Послуги</div>
                <div class="services-list">
                    {#each appointment.services as service}
                        <span class="service-tag">{service.name}</span>
                    {/each}
                </div>
            </div>
        </div>

        <div class="info-row">
            <span class="icon">💰</span>
            <div>
                <div class="label">Вартість</div>
                <div class="value price">{appointment.total_price} грн</div>
            </div>
        </div>
    </div>

    {#if !isPast && appointment.status === "SCHEDULED"}
        <div class="card-actions">
            <button
                class="action-btn reschedule-btn"
                on:click={() => (showRescheduleModal = true)}
            >
                🔄 Змінити час
            </button>
            <button
                class="action-btn cancel-btn"
                on:click={() => (showCancelModal = true)}
            >
                ❌ Скасувати
            </button>
        </div>
    {/if}
</div>

{#if showCancelModal}
    <CancelModal
        {appointment}
        on:close={() => (showCancelModal = false)}
        on:success={handleCancelSuccess}
    />
{/if}

{#if showRescheduleModal}
    <RescheduleModal
        {appointment}
        on:close={() => (showRescheduleModal = false)}
        on:success={handleRescheduleSuccess}
    />
{/if}

<style>
    .booking-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
    }

    .booking-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
    }

    .status-badge {
        padding: 0.375rem 0.75rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .status-scheduled {
        background: #d1fae5;
        color: #065f46;
    }

    .status-completed {
        background: #dbeafe;
        color: #1e40af;
    }

    .status-cancelled {
        background: #fee2e2;
        color: #991b1b;
    }

    .status-default {
        background: #e5e7eb;
        color: #374151;
    }

    .appointment-id {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 600;
    }

    .card-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .info-row {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
    }

    .icon {
        font-size: 1.5rem;
        min-width: 2rem;
    }

    .label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
    }

    .value {
        font-size: 1rem;
        color: #111827;
        font-weight: 500;
    }

    .value.price {
        font-size: 1.25rem;
        color: #7c3aed;
        font-weight: 700;
    }

    .services-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .service-tag {
        background: #ede9fe;
        color: #7c3aed;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .card-actions {
        display: flex;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
    }

    .action-btn {
        flex: 1;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9375rem;
    }

    .reschedule-btn {
        background: #dbeafe;
        color: #1e40af;
    }

    .reschedule-btn:hover {
        background: #bfdbfe;
        transform: translateY(-1px);
    }

    .cancel-btn {
        background: #fee2e2;
        color: #991b1b;
    }

    .cancel-btn:hover {
        background: #fecaca;
        transform: translateY(-1px);
    }

    @media (max-width: 640px) {
        .card-header,
        .card-body,
        .card-actions {
            padding: 1rem;
        }

        .info-row {
            gap: 0.75rem;
        }

        .icon {
            font-size: 1.25rem;
            min-width: 1.5rem;
        }

        .card-actions {
            flex-direction: column;
        }

        .action-btn {
            width: 100%;
        }
    }
</style>
