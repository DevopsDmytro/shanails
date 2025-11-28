<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let show = false;
    export let dayOfWeek: number | null = null;
    export let specificDate: string | null = null;
    export let existingSlots: Array<{ start: string; end: string }> = [];
    export let masterId: number;

    const dispatch = createEventDispatcher();

    const daysOfWeek = [
        "Неділя",
        "Понеділок",
        "Вівторок",
        "Середа",
        "Четвер",
        "П'ятниця",
        "Субота",
    ];

    // Generate timeslots from 09:00 to 20:00 in 30-minute intervals
    function generateTimeslots(): string[] {
        const slots: string[] = [];
        for (let hour = 9; hour <= 19; hour++) {
            for (let minute of [0, 30]) {
                const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                slots.push(time);
            }
        }
        slots.push("20:00"); // Add final slot
        return slots;
    }

    const allTimeslots = generateTimeslots();
    let enabledSlots = new Set<string>();

    // Initialize enabled slots from existing schedules
    $: if (show && existingSlots.length > 0) {
        enabledSlots = new Set();
        existingSlots.forEach((slot) => {
            // Find all timeslots between start and end
            const startIdx = allTimeslots.indexOf(slot.start);
            const endIdx = allTimeslots.indexOf(slot.end);
            if (startIdx >= 0 && endIdx > startIdx) {
                for (let i = startIdx; i < endIdx; i++) {
                    enabledSlots.add(allTimeslots[i]);
                }
            }
        });
        enabledSlots = enabledSlots; // Trigger reactivity
    }

    function toggleSlot(slot: string) {
        if (enabledSlots.has(slot)) {
            enabledSlots.delete(slot);
        } else {
            enabledSlots.add(slot);
        }
        enabledSlots = enabledSlots; // Trigger reactivity
    }

    function handleSave() {
        // Convert enabled slots to continuous time ranges
        const sortedSlots = Array.from(enabledSlots).sort();
        const ranges: Array<{ start: string; end: string }> = [];

        if (sortedSlots.length > 0) {
            let rangeStart = sortedSlots[0];
            let lastSlot = sortedSlots[0];

            for (let i = 1; i < sortedSlots.length; i++) {
                const currentSlot = sortedSlots[i];
                const lastIdx = allTimeslots.indexOf(lastSlot);
                const currentIdx = allTimeslots.indexOf(currentSlot);

                // Check if slots are consecutive
                if (currentIdx === lastIdx + 1) {
                    lastSlot = currentSlot;
                } else {
                    // End current range and start new one
                    const endIdx = allTimeslots.indexOf(lastSlot) + 1;
                    ranges.push({
                        start: rangeStart,
                        end: allTimeslots[endIdx] || lastSlot,
                    });
                    rangeStart = currentSlot;
                    lastSlot = currentSlot;
                }
            }

            // Add final range
            const endIdx = allTimeslots.indexOf(lastSlot) + 1;
            ranges.push({
                start: rangeStart,
                end: allTimeslots[endIdx] || lastSlot,
            });
        }

        dispatch("save", { dayOfWeek, specificDate, ranges });
    }

    function handleClose() {
        dispatch("close");
    }

    $: title = specificDate
        ? `Редагувати розклад на ${formatDate(specificDate)}`
        : dayOfWeek !== null
          ? `Редагувати розклад: ${daysOfWeek[dayOfWeek]}`
          : "Редагувати розклад";

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("uk-UA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click={handleClose}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2>{title}</h2>
                <button class="close-btn" on:click={handleClose}>&times;</button
                >
            </div>

            <div class="modal-body">
                <p class="instructions">
                    Оберіть доступні годini для запису. Натисніть на час, щоб
                    увімкнути/вимкнути.
                </p>

                <div class="timeslots-grid">
                    {#each allTimeslots.slice(0, -1) as slot}
                        <button
                            class="timeslot-btn"
                            class:enabled={enabledSlots.has(slot)}
                            on:click={() => toggleSlot(slot)}
                        >
                            {slot}
                        </button>
                    {/each}
                </div>

                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-box enabled"></div>
                        <span>Доступно</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-box disabled"></div>
                        <span>Недоступно</span>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" on:click={handleClose}>
                    Скасувати
                </button>
                <button class="btn btn-primary" on:click={handleSave}>
                    Зберегти
                </button>
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
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        background: white;
        z-index: 1;
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

    .instructions {
        margin: 0 0 1.5rem;
        color: #6b7280;
        font-size: 0.9375rem;
    }

    .timeslots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }

    .timeslot-btn {
        padding: 0.75rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9375rem;
        transition: all 0.2s ease;
    }

    .timeslot-btn:hover {
        border-color: #7c3aed;
        transform: translateY(-2px);
    }

    .timeslot-btn.enabled {
        background: #10b981;
        border-color: #10b981;
        color: white;
    }

    .timeslot-btn.enabled:hover {
        background: #059669;
        border-color: #059669;
    }

    .legend {
        display: flex;
        gap: 1.5rem;
        justify-content: center;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 8px;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .legend-box {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 2px solid #e5e7eb;
    }

    .legend-box.enabled {
        background: #10b981;
        border-color: #10b981;
    }

    .legend-box.disabled {
        background: white;
    }

    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        position: sticky;
        bottom: 0;
        background: white;
    }

    .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
    }

    .btn-primary {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }

    .btn-secondary {
        background: #e5e7eb;
        color: #374151;
    }

    .btn-secondary:hover {
        background: #d1d5db;
    }

    @media (max-width: 640px) {
        .timeslots-grid {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
            gap: 0.5rem;
        }

        .timeslot-btn {
            padding: 0.5rem;
            font-size: 0.875rem;
        }
    }
</style>
