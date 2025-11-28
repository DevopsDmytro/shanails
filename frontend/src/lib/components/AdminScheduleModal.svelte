<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        adminCreateSchedule,
        adminUpdateSchedule,
        type Schedule,
    } from "$lib/api";

    export let show = false;
    export let schedule: Schedule | null = null;
    export let masterId: number;

    const dispatch = createEventDispatcher();

    let dayOfWeek = 1;
    let startTime = "09:00";
    let endTime = "18:00";

    let loading = false;

    const days = [
        { id: 1, name: "Понеділок" },
        { id: 2, name: "Вівторок" },
        { id: 3, name: "Середа" },
        { id: 4, name: "Четвер" },
        { id: 5, name: "П'ятниця" },
        { id: 6, name: "Субота" },
        { id: 0, name: "Неділя" },
    ];

    $: if (show) {
        if (schedule) {
            dayOfWeek = schedule.day_of_week;
            startTime = schedule.start_time;
            endTime = schedule.end_time;
        } else {
            resetForm();
        }
    }

    function resetForm() {
        dayOfWeek = 1;
        startTime = "09:00";
        endTime = "18:00";
    }

    async function handleSave() {
        if (!masterId) return;
        loading = true;
        try {
            const data = {
                master_id: masterId,
                day_of_week: dayOfWeek,
                start_time: startTime,
                end_time: endTime,
                is_break: false,
                note: "",
                is_available: true,
            };

            if (schedule) {
                await adminUpdateSchedule(schedule.id, data);
            } else {
                await adminCreateSchedule(data);
            }
            dispatch("save");
            dispatch("close");
        } catch (err: any) {
            alert(err.message);
        } finally {
            loading = false;
        }
    }

    function handleClose() {
        dispatch("close");
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click={handleClose}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2>{schedule ? "Редагувати" : "Додати"} розклад</h2>
                <button class="close-btn" on:click={handleClose}>&times;</button
                >
            </div>

            <div class="modal-body">
                <div class="form-group">
                    <label for="dayOfWeek">День тижня</label>
                    <select id="dayOfWeek" bind:value={dayOfWeek}>
                        {#each days as day}
                            <option value={day.id}>{day.name}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="startTime">Початок</label>
                        <input
                            id="startTime"
                            type="time"
                            bind:value={startTime}
                        />
                    </div>
                    <div class="form-group">
                        <label for="endTime">Кінець</label>
                        <input id="endTime" type="time" bind:value={endTime} />
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-secondary" on:click={handleClose}
                        >Скасувати</button
                    >
                    <button
                        class="btn btn-primary"
                        on:click={handleSave}
                        disabled={loading}
                    >
                        {loading ? "Збереження..." : "Зберегти"}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #111827;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6b7280;
        cursor: pointer;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    label {
        display: block;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
    }

    input[type="text"],
    input[type="time"],
    select {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 1rem;
    }

    .checkbox label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        border: none;
    }

    .btn-primary {
        background: #7c3aed;
        color: white;
    }

    .btn-secondary {
        background: #e5e7eb;
        color: #374151;
    }
</style>
