<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let selectedSlots: string[] = []; // Array of start times like ["10:00", "12:00", "14:00"]
    export let disabled = false;

    // Generate 2-hour time slots from 10:00 to 22:00
    const TIME_SLOTS = [
        { start: "10:00", end: "12:00" },
        { start: "12:00", end: "14:00" },
        { start: "14:00", end: "16:00" },
        { start: "16:00", end: "18:00" },
        { start: "18:00", end: "20:00" },
        { start: "20:00", end: "22:00" },
    ];

    function toggleSlot(startTime: string) {
        if (disabled) return;

        const index = selectedSlots.indexOf(startTime);
        if (index > -1) {
            selectedSlots = selectedSlots.filter((s) => s !== startTime);
        } else {
            selectedSlots = [...selectedSlots, startTime];
        }

        dispatch("change", { selectedSlots });
    }

    function isSlotSelected(startTime: string): boolean {
        return selectedSlots.includes(startTime);
    }

    function selectAll() {
        if (disabled) return;
        selectedSlots = TIME_SLOTS.map((slot) => slot.start);
        dispatch("change", { selectedSlots });
    }

    function clearAll() {
        if (disabled) return;
        selectedSlots = [];
        dispatch("change", { selectedSlots });
    }
</script>

<div class="timeslot-grid">
    <div class="grid-header">
        <span class="header-title">Робочі години</span>
        <div class="header-actions">
            <button class="action-btn" on:click={selectAll} {disabled}>
                ✓ Всі
            </button>
            <button class="action-btn" on:click={clearAll} {disabled}>
                ✗ Очистити
            </button>
        </div>
    </div>

    <div class="slots-container">
        {#each TIME_SLOTS as slot}
            <button
                class="time-slot"
                class:selected={isSlotSelected(slot.start)}
                class:disabled
                on:click={() => toggleSlot(slot.start)}
                {disabled}
            >
                <span class="slot-time">{slot.start} - {slot.end}</span>
                <span class="slot-status">
                    {isSlotSelected(slot.start) ? "✓ Доступно" : "✗ Недоступно"}
                </span>
            </button>
        {/each}
    </div>

    <div class="grid-footer">
        <span class="selected-count">
            Обрано: {selectedSlots.length} з {TIME_SLOTS.length} слотів
        </span>
    </div>
</div>

<style>
    .timeslot-grid {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
    }

    .grid-header {
        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-title {
        font-weight: 600;
        color: #374151;
        font-size: 0.9375rem;
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

    .action-btn {
        padding: 0.375rem 0.75rem;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-btn:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #9ca3af;
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .slots-container {
        padding: 1.25rem;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.75rem;
    }

    .time-slot {
        padding: 1rem;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        text-align: left;
    }

    .time-slot:hover:not(.disabled) {
        border-color: #7c3aed;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
    }

    .time-slot.selected {
        background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
        border-color: #7c3aed;
    }

    .time-slot.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .slot-time {
        font-weight: 600;
        color: #111827;
        font-size: 0.9375rem;
    }

    .slot-status {
        font-size: 0.8125rem;
        color: #6b7280;
    }

    .time-slot.selected .slot-status {
        color: #7c3aed;
        font-weight: 600;
    }

    .grid-footer {
        background: #f9fafb;
        padding: 0.875rem 1.25rem;
        border-top: 1px solid #e5e7eb;
    }

    .selected-count {
        font-size: 0.875rem;
        color: #6b7280;
    }

    @media (max-width: 768px) {
        .slots-container {
            grid-template-columns: 1fr;
        }

        .grid-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
        }
    }
</style>
