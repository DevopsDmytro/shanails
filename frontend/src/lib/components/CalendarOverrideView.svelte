<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import TimeSlotGrid from "./TimeSlotGrid.svelte";

    const dispatch = createEventDispatcher();

    export let masterId: number;
    export let overrides: any[] = []; // Array of schedule overrides
    export let weeklySchedule: any[] = []; // Weekly default schedule
    export let loading = false;

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth(); // 0-11
    let selectedDate: Date | null = null;
    let selectedDateSlots: string[] = [];
    let isDayOff = false;
    let note = "";

    const MONTHS = [
        "Січень",
        "Лютий",
        "Березень",
        "Квітень",
        "Май",
        "Червень",
        "Липень",
        "Серпень",
        "Вересень",
        "Жовтень",
        "Листопад",
        "Грудень",
    ];

    $: monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    $: dispatch("monthChange", { month: monthStr });

    function getDaysInMonth(year: number, month: number): Date[] {
        const days: Date[] = [];
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Add empty days for start of month
        const startDay = firstDay.getDay() || 7; // Monday = 1, Sunday = 7
        for (let i = 1; i < startDay; i++) {
            days.push(null as any);
        }

        // Add all days of month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }

    $: calendarDays = getDaysInMonth(currentYear, currentMonth);

    function prevMonth() {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        selectedDate = null; // Clear selection when changing months
    }

    function nextMonth() {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        selectedDate = null; // Clear selection when changing months
    }

    function getOverrideForDate(date: Date | null): any {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        return overrides.find((o) => o.specific_date === dateStr);
    }

    function getWeeklyScheduleForDate(date: Date | null): string[] {
        if (!date) return [];
        const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7
        const daySchedule = weeklySchedule.find(
            (s) => s.day_of_week === dayOfWeek,
        );
        if (!daySchedule) return [];
        return daySchedule.time_slots
            .filter((ts: any) => ts.is_enabled)
            .map((ts: any) => ts.start_time);
    }

    function getSlotsForDate(date: Date | null): string[] {
        const override = getOverrideForDate(date);
        if (override) {
            if (override.is_day_off) return [];
            return override.time_slots
                .filter((ts: any) => ts.is_enabled)
                .map((ts: any) => ts.start_time);
        }
        return getWeeklyScheduleForDate(date);
    }

    function isToday(date: Date | null): boolean {
        if (!date) return false;
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    }

    function selectDate(date: Date) {
        selectedDate = date;
        selectedDateSlots = getSlotsForDate(date);
    }

    function handleSlotsChange(event: CustomEvent) {
        selectedDateSlots = event.detail.selectedSlots;
    }

    function saveSelectedDate() {
        if (!selectedDate) return;

        const overrideData = {
            specific_date: (() => {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(
                    2,
                    "0",
                );
                const day = String(selectedDate.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
            })(),
            is_day_off: false,
            note: null,
            time_slots: selectedDateSlots.map((startTime) => ({
                start_time: startTime,
                duration_minutes: 120,
                is_enabled: true,
                slot_type: "work",
            })),
        };

        dispatch("saveOverride", { overrideData });
    }

    function deleteSelectedDate() {
        if (!selectedDate) return;
        if (!getOverrideForDate(selectedDate)) {
            alert("Немає перевизначення для видалення");
            return;
        }
        if (!confirm("Видалити перевизначення для цієї дати?")) return;

        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        dispatch("deleteOverride", { date: dateStr });
        selectedDate = null;
    }

    function hasCustomSchedule(date: Date | null): boolean {
        return !!getOverrideForDate(date);
    }
</script>

<div class="calendar-container">
    <div class="calendar-section">
        <div class="calendar-header">
            <button class="nav-btn" on:click={prevMonth} disabled={loading}>
                ← Попередній
            </button>
            <h3 class="month-title">{MONTHS[currentMonth]} {currentYear}</h3>
            <button class="nav-btn" on:click={nextMonth} disabled={loading}>
                Наступний →
            </button>
        </div>

        <div class="calendar-grid">
            <div class="weekday-header">Пн</div>
            <div class="weekday-header">Вт</div>
            <div class="weekday-header">Ср</div>
            <div class="weekday-header">Чт</div>
            <div class="weekday-header">Пт</div>
            <div class="weekday-header">Сб</div>
            <div class="weekday-header">Нд</div>

            {#each calendarDays as day}
                {#if day}
                    {@const override = getOverrideForDate(day)}
                    {@const slots = getSlotsForDate(day)}
                    {@const isSelected =
                        selectedDate &&
                        day.toDateString() === selectedDate.toDateString()}
                    <button
                        class="calendar-day"
                        class:today={isToday(day)}
                        class:has-override={hasCustomSchedule(day)}
                        class:day-off={override?.is_day_off}
                        class:selected={isSelected}
                        on:click={() => selectDate(day)}
                        disabled={loading}
                    >
                        <span class="day-number">{day.getDate()}</span>
                        <span class="day-slots">
                            {#if override?.is_day_off}
                                🔴
                            {:else}
                                {slots.length} слотів
                            {/if}
                        </span>
                    </button>
                {:else}
                    <div class="calendar-day empty"></div>
                {/if}
            {/each}
        </div>

        <div class="calendar-legend">
            <div class="legend-item">
                <span class="legend-dot today-dot"></span>
                <span>Сьогодні</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot override-dot"></span>
                <span>Змінений розклад</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot dayoff-dot"></span>
                <span>Вихідний</span>
            </div>
        </div>
    </div>

    {#if selectedDate}
        <div class="editor-section">
            <div class="editor-header">
                <h3>
                    {selectedDate.getDate()}
                    {MONTHS[selectedDate.getMonth()]}
                    {selectedDate.getFullYear()}
                </h3>
                <div class="header-actions">
                    {#if hasCustomSchedule(selectedDate)}
                        <button
                            class="btn-danger-small"
                            on:click={deleteSelectedDate}
                        >
                            Видалити override
                        </button>
                    {/if}
                </div>
            </div>

            <div class="editor-body">
                <div class="timeslot-section">
                    <TimeSlotGrid
                        selectedSlots={selectedDateSlots}
                        disabled={loading}
                        on:change={handleSlotsChange}
                    />
                </div>

                <div class="editor-actions">
                    <button
                        class="btn-primary"
                        on:click={saveSelectedDate}
                        disabled={loading}
                    >
                        {loading ? "Збереження..." : "Зберегти"}
                    </button>
                </div>
            </div>
        </div>
    {:else}
        <div class="empty-editor">
            <p>👆 Оберіть дату в календарі щоб налаштувати розклад</p>
        </div>
    {/if}
</div>

<style>
    .calendar-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }

    .calendar-section,
    .editor-section,
    .empty-editor {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .nav-btn {
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .nav-btn:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #9ca3af;
    }

    .nav-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .month-title {
        margin: 0;
        font-size: 1.25rem;
        color: #111827;
        font-weight: 600;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .weekday-header {
        padding: 0.75rem;
        text-align: center;
        font-weight: 600;
        font-size: 0.875rem;
        color: #6b7280;
        border-bottom: 2px solid #e5e7eb;
    }

    .calendar-day {
        aspect-ratio: 1;
        padding: 0.5rem;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
    }

    .calendar-day:hover:not(.empty):not(:disabled) {
        border-color: #7c3aed;
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
    }

    .calendar-day.empty {
        border: none;
        cursor: default;
    }

    .calendar-day.selected {
        background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
        border-color: #7c3aed;
        border-width: 3px;
    }

    .calendar-day.today {
        border-color: #7c3aed;
        font-weight: 600;
    }

    .calendar-day.has-override:not(.selected) {
        background: #f0fdf4;
        border-color: #10b981;
    }

    .calendar-day.day-off {
        background: #fef2f2;
        border-color: #ef4444;
    }

    .day-number {
        font-size: 1rem;
        color: #111827;
    }

    .day-slots {
        font-size: 0.7rem;
        color: #6b7280;
    }

    .calendar-legend {
        display: flex;
        gap: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .today-dot {
        background: #7c3aed;
    }

    .override-dot {
        background: #10b981;
    }

    .dayoff-dot {
        background: #ef4444;
    }

    .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e5e7eb;
    }

    .editor-header h3 {
        margin: 0;
        color: #111827;
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-danger-small {
        padding: 0.5rem 1rem;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-danger-small:hover {
        background: #dc2626;
    }

    .editor-body {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-group label {
        font-weight: 600;
        color: #374151;
        font-size: 0.9375rem;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        flex-direction: row !important;
    }

    .checkbox-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }

    .note-input {
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.9375rem;
    }

    .note-input:focus {
        outline: none;
        border-color: #7c3aed;
    }

    .editor-actions {
        display: flex;
        justify-content: flex-end;
    }

    .btn-primary {
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .empty-editor {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        color: #6b7280;
        font-size: 1.125rem;
        text-align: center;
    }

    @media (max-width: 1024px) {
        .calendar-container {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .calendar-grid {
            gap: 0.25rem;
        }

        .calendar-day {
            padding: 0.25rem;
        }

        .day-number {
            font-size: 0.8125rem;
        }

        .day-slots {
            font-size: 0.625rem;
        }

        .calendar-legend {
            flex-direction: column;
            gap: 0.75rem;
        }
    }
</style>
