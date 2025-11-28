<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import TimeSlotGrid from "./TimeSlotGrid.svelte";

    const dispatch = createEventDispatcher();

    export let masterId: number;
    export let weeklySchedule: any[] = []; // Array of day schedules
    export let loading = false;

    const DAYS = [
        { id: 1, name: "Понеділок", short: "Пн" },
        { id: 2, name: "Вівторок", short: "Вт" },
        { id: 3, name: "Середа", short: "Ср" },
        { id: 4, name: "Четвер", short: "Чт" },
        { id: 5, name: "П'ятниця", short: "Пт" },
        { id: 6, name: "Субота", short: "Сб" },
        { id: 7, name: "Неділя", short: "Нд" },
    ];

    let selectedDay = 1;
    let daySlots: { [day: number]: string[] } = {};

    // Initialize day slots from weeklySchedule
    $: {
        if (weeklySchedule.length > 0) {
            daySlots = {};
            weeklySchedule.forEach((schedule) => {
                daySlots[schedule.day_of_week] = schedule.time_slots
                    .filter((ts: any) => ts.is_enabled)
                    .map((ts: any) => ts.start_time);
            });
        }
    }

    function handleSlotsChange(event: CustomEvent) {
        const { selectedSlots } = event.detail;
        daySlots[selectedDay] = selectedSlots;
        daySlots = { ...daySlots }; // Trigger reactivity
    }

    function getDaySlotsCount(dayId: number): number {
        return daySlots[dayId]?.length || 0;
    }

    function saveSchedule() {
        // Convert slot data to API format
        const scheduleData = DAYS.map((day) => ({
            day_of_week: day.id,
            time_slots: (daySlots[day.id] || []).map((startTime) => ({
                start_time: startTime,
                duration_minutes: 120, // 2 hours
                is_enabled: true,
                slot_type: "work",
            })),
        }));

        dispatch("save", { scheduleData });
    }
</script>

<div class="weekly-editor">
    <div class="editor-header">
        <h3>Тижневий Розклад</h3>
        <p class="subtitle">Налаштуйте робочі години для кожного дня тижня</p>
    </div>

    <div class="editor-body">
        <!-- Day selector -->
        <div class="day-selector">
            {#each DAYS as day}
                <button
                    class="day-btn"
                    class:active={selectedDay === day.id}
                    class:configured={getDaySlotsCount(day.id) > 0}
                    on:click={() => (selectedDay = day.id)}
                    disabled={loading}
                >
                    <span class="day-name">{day.short}</span>
                    <span class="day-count">
                        {getDaySlotsCount(day.id)}
                    </span>
                </button>
            {/each}
        </div>

        <!-- Time slot grid for selected day -->
        <div class="day-editor">
            <div class="day-title">
                <h4>{DAYS.find((d) => d.id === selectedDay)?.name || ""}</h4>
                <span class="day-slots-info">
                    {getDaySlotsCount(selectedDay)} слотів обрано
                </span>
            </div>

            <TimeSlotGrid
                selectedSlots={daySlots[selectedDay] || []}
                disabled={loading}
                on:change={handleSlotsChange}
            />
        </div>
    </div>

    <div class="editor-footer">
        <button
            class="btn-secondary"
            on:click={() => dispatch("cancel")}
            disabled={loading}
        >
            Скасувати
        </button>
        <button class="btn-primary" on:click={saveSchedule} disabled={loading}>
            {loading ? "Збереження..." : "Зберегти Розклад"}
        </button>
    </div>
</div>

<style>
    .weekly-editor {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .editor-header {
        padding: 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .editor-header h3 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
    }

    .subtitle {
        margin: 0;
        opacity: 0.9;
        font-size: 0.9375rem;
    }

    .editor-body {
        padding: 1.5rem;
    }

    .day-selector {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .day-btn {
        padding: 0.75rem 0.5rem;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }

    .day-btn:hover:not(:disabled) {
        border-color: #7c3aed;
        transform: translateY(-2px);
    }

    .day-btn.active {
        background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
        border-color: #7c3aed;
    }

    .day-btn.configured:not(.active) {
        border-color: #10b981;
        background: #f0fdf4;
    }

    .day-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .day-name {
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
    }

    .day-count {
        font-size: 0.75rem;
        color: #6b7280;
        background: #f3f4f6;
        padding: 0.125rem 0.5rem;
        border-radius: 12px;
    }

    .day-btn.configured .day-count {
        background: #d1fae5;
        color: #065f46;
        font-weight: 600;
    }

    .day-btn.active .day-count {
        background: #c4b5fd;
        color: #5b21b6;
    }

    .day-editor {
        background: #f9fafb;
        border-radius: 12px;
        padding: 1.5rem;
    }

    .day-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .day-title h4 {
        margin: 0;
        color: #111827;
        font-size: 1.125rem;
    }

    .day-slots-info {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .editor-footer {
        padding: 1.5rem;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }

    .btn-secondary,
    .btn-primary {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9375rem;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }

    .btn-secondary {
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #f9fafb;
    }

    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary:disabled,
    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .day-selector {
            grid-template-columns: repeat(4, 1fr);
        }

        .editor-footer {
            flex-direction: column;
        }

        .btn-secondary,
        .btn-primary {
            width: 100%;
        }
    }
</style>
