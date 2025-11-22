<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import type { Appointment } from "$lib/api";
    import { checkCanReschedule, rescheduleAppointment } from "$lib/api";
    import LimitWarningModal from "./LimitWarningModal.svelte";

    export let appointment: Appointment;

    const dispatch = createEventDispatcher();

    let loading = true;
    let canReschedule = false;
    let reason: string | null = null;
    let rescheduling = false;
    let showLimitWarning = false;
    let error: string | null = null;

    let newDate = "";
    let newTime = "";

    onMount(async () => {
        try {
            const response = await checkCanReschedule(appointment.id);
            canReschedule = response.allowed;
            reason = response.reason;

            // Pre-fill with current date/time
            const current = new Date(appointment.start_time);
            newDate = current.toISOString().split("T")[0];
            newTime = current.toTimeString().slice(0, 5);
        } catch (err: any) {
            error = err.message || "Failed to check reschedule eligibility";
        } finally {
            loading = false;
        }
    });

    async function handleConfirm() {
        if (!canReschedule) {
            showLimitWarning = true;
            return;
        }

        if (!newDate || !newTime) {
            error = "Будь ласка, виберіть дату та час";
            return;
        }

        try {
            rescheduling = true;
            const newStartTime = `${newDate}T${newTime}:00`;
            await rescheduleAppointment(appointment.id, newStartTime);
            dispatch("success");
        } catch (err: any) {
            error = err.message || "Failed to reschedule appointment";
        } finally {
            rescheduling = false;
        }
    }

    function handleClose() {
        dispatch("close");
    }
</script>

<div class="modal-overlay" on:click={handleClose}>
    <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
            <h2>Змінити час запису</h2>
            <button class="close-btn" on:click={handleClose}>✕</button>
        </div>

        <div class="modal-body">
            {#if loading}
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Перевірка...</p>
                </div>
            {:else if error}
                <div class="error">
                    <p>❌ {error}</p>
                </div>
            {:else}
                <div class="appointment-summary">
                    <p class="summary-label">Поточний запис:</p>
                    <div class="summary-row">
                        <span class="label">Дата:</span>
                        <span class="value">
                            {new Date(
                                appointment.start_time,
                            ).toLocaleDateString("uk-UA", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                    <div class="summary-row">
                        <span class="label">Час:</span>
                        <span class="value">
                            {new Date(
                                appointment.start_time,
                            ).toLocaleTimeString("uk-UA", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                </div>

                {#if canReschedule}
                    <div class="form-group">
                        <label for="newDate">Нова дата:</label>
                        <input
                            id="newDate"
                            type="date"
                            bind:value={newDate}
                            min={new Date().toISOString().split("T")[0]}
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="newTime">Новий час:</label>
                        <input
                            id="newTime"
                            type="time"
                            bind:value={newTime}
                            required
                        />
                    </div>
                {:else if reason}
                    <div class="warning-box">
                        <p class="warning-icon">⚠️</p>
                        <p class="warning-text">{reason}</p>
                    </div>
                {/if}
            {/if}
        </div>

        <div class="modal-footer">
            <button
                class="btn btn-secondary"
                on:click={handleClose}
                disabled={rescheduling}
            >
                Відмінити
            </button>
            <button
                class="btn btn-primary"
                on:click={handleConfirm}
                disabled={loading || rescheduling || !canReschedule}
            >
                {rescheduling
                    ? "Збереження..."
                    : canReschedule
                      ? "Зберегти зміни"
                      : "Зателефонувати"}
            </button>
        </div>
    </div>
</div>

{#if showLimitWarning}
    <LimitWarningModal
        message={reason || "Досягнуто ліміт змін часу"}
        on:close={() => {
            showLimitWarning = false;
            handleClose();
        }}
    />
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6b7280;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
        transition: color 0.2s;
    }

    .close-btn:hover {
        color: #111827;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .loading,
    .error {
        text-align: center;
        padding: 2rem 0;
    }

    .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #7c3aed;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .error p {
        color: #dc2626;
    }

    .appointment-summary {
        background: #f9fafb;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .summary-label {
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.75rem;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
    }

    .summary-row .label {
        color: #6b7280;
        font-weight: 500;
    }

    .summary-row .value {
        color: #111827;
        font-weight: 600;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
    }

    .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    .form-group input:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }

    .warning-box {
        background: #fef3c7;
        border: 1px solid #fbbf24;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
    }

    .warning-icon {
        font-size: 1.5rem;
        margin: 0;
    }

    .warning-text {
        color: #92400e;
        margin: 0;
        line-height: 1.5;
    }

    .modal-footer {
        display: flex;
        gap: 0.75rem;
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    .btn {
        flex: 1;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1rem;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: #e5e7eb;
        color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #d1d5db;
    }

    .btn-primary {
        background: #7c3aed;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: #6d28d9;
    }
</style>
