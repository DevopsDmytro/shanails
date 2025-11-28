<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {
        adminGetUsers,
        createAppointment,
        type User,
        type Master,
        type Service,
    } from "$lib/api";
    import MasterSelector from "./MasterSelector.svelte";
    import ServiceSelector from "./ServiceSelector.svelte";
    import DateTimePicker from "./DateTimePicker.svelte";

    export let show = false;

    const dispatch = createEventDispatcher();

    // State
    let step = 1;
    let selectedUser: User | null = null;
    let selectedMaster: Master | null = null;
    let selectedServices: Service[] = [];
    let selectedDate = "";
    let selectedTime = "";
    let availableSlots: string[] = [];
    let loadingAvailability = false;

    // User Search
    let userSearchQuery = "";
    let users: User[] = [];
    let loadingUsers = false;

    $: if (show) {
        resetForm();
    }

    function resetForm() {
        step = 1;
        selectedUser = null;
        selectedMaster = null;
        selectedServices = [];
        selectedDate = "";
        selectedTime = "";
        userSearchQuery = "";
        users = [];
    }

    async function searchUsers() {
        if (!userSearchQuery) return;
        loadingUsers = true;
        try {
            const response = await adminGetUsers({
                search: userSearchQuery,
                limit: 5,
                role: "CLIENT",
            });
            users = response.users;
        } catch (err) {
            console.error("Failed to search users:", err);
        } finally {
            loadingUsers = false;
        }
    }

    function selectUser(user: User) {
        selectedUser = user;
        step = 2;
    }

    function handleMasterSelect(event: CustomEvent<Master>) {
        selectedMaster = event.detail;
        step = 3;
    }

    function handleServicesSelect(event: CustomEvent<Service[]>) {
        selectedServices = event.detail;
    }

    function goToDateStep() {
        if (selectedServices.length > 0) {
            step = 4;
        }
    }

    function handleDateSelect(event: CustomEvent<string>) {
        selectedDate = event.detail;
        selectedTime = "";
        // DateTimePicker handles loading slots internally via props,
        // but we need to trigger it.
        // Actually DateTimePicker in this project seems to emit dateSelect
        // and expects parent to load slots.
        // Let's check MultiStepBooking logic.
    }

    function handleTimeSelect(event: CustomEvent<string>) {
        selectedTime = event.detail;
    }

    // We need to implement loadTimeSlots logic here similar to MultiStepBooking
    import { getAvailability } from "$lib/api";

    async function loadTimeSlots(date: string) {
        if (!selectedMaster || !date) return;
        loadingAvailability = true;
        availableSlots = [];
        try {
            const response = await getAvailability(selectedMaster.id, date);
            availableSlots = response.available_slots;
        } catch (err) {
            console.error("Failed to load time slots:", err);
        } finally {
            loadingAvailability = false;
        }
    }

    // Override handleDateSelect to call loadTimeSlots
    async function onDateSelect(event: CustomEvent<string>) {
        selectedDate = event.detail;
        selectedTime = "";
        await loadTimeSlots(selectedDate);
    }

    async function handleConfirm() {
        if (
            !selectedUser ||
            !selectedMaster ||
            !selectedDate ||
            !selectedTime ||
            selectedServices.length === 0
        ) {
            return;
        }

        try {
            await createAppointment({
                master_id: selectedMaster.id,
                service_ids: selectedServices.map((s) => s.id),
                start_time: `${selectedDate}T${selectedTime}:00`,
                user_id: selectedUser.id, // Admin can specify user_id
            });
            dispatch("save");
            dispatch("close");
        } catch (err: any) {
            alert(err.message);
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
                <h2>Новий запис</h2>
                <button class="close-btn" on:click={handleClose}>&times;</button
                >
            </div>

            <div class="modal-body">
                {#if step === 1}
                    <div class="step-user">
                        <h3>Крок 1: Оберіть клієнта</h3>
                        <div class="search-box">
                            <input
                                type="text"
                                bind:value={userSearchQuery}
                                placeholder="Пошук за ім'ям або телефоном..."
                                on:input={searchUsers}
                            />
                        </div>
                        <div class="users-list">
                            {#if loadingUsers}
                                <div class="loading">Пошук...</div>
                            {:else if users.length > 0}
                                {#each users as user}
                                    <button
                                        class="user-item"
                                        on:click={() => selectUser(user)}
                                    >
                                        <div class="user-name">{user.name}</div>
                                        <div class="user-phone">
                                            {user.phone || "Без телефону"}
                                        </div>
                                    </button>
                                {/each}
                            {:else if userSearchQuery}
                                <div class="empty">Клієнтів не знайдено</div>
                            {/if}
                        </div>
                    </div>
                {:else if step === 2}
                    <div class="step-master">
                        <h3>Крок 2: Оберіть майстра</h3>
                        <MasterSelector
                            {selectedMaster}
                            on:select={handleMasterSelect}
                        />
                        <button
                            class="btn btn-secondary"
                            on:click={() => (step = 1)}>Назад</button
                        >
                    </div>
                {:else if step === 3}
                    <div class="step-services">
                        <h3>Крок 3: Оберіть послуги</h3>
                        <ServiceSelector
                            {selectedServices}
                            on:select={handleServicesSelect}
                        />
                        <div class="step-actions">
                            <button
                                class="btn btn-secondary"
                                on:click={() => (step = 2)}>Назад</button
                            >
                            <button
                                class="btn btn-primary"
                                disabled={selectedServices.length === 0}
                                on:click={goToDateStep}>Далі</button
                            >
                        </div>
                    </div>
                {:else if step === 4}
                    <div class="step-date">
                        <h3>Крок 4: Дата та час</h3>
                        <DateTimePicker
                            {selectedMaster}
                            {selectedDate}
                            {selectedTime}
                            {availableSlots}
                            {loadingAvailability}
                            on:dateSelect={onDateSelect}
                            on:timeSelect={handleTimeSelect}
                        />
                        <div class="step-actions">
                            <button
                                class="btn btn-secondary"
                                on:click={() => (step = 3)}>Назад</button
                            >
                            <button
                                class="btn btn-primary"
                                disabled={!selectedDate || !selectedTime}
                                on:click={handleConfirm}
                                >Підтвердити запис</button
                            >
                        </div>
                    </div>
                {/if}
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
        max-width: 600px;
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
        z-index: 10;
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
        padding: 0;
        line-height: 1;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .search-box input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 1rem;
        margin-bottom: 1rem;
    }

    .users-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
    }

    .user-item {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        padding: 1rem;
        border-radius: 8px;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
    }

    .user-item:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
    }

    .user-name {
        font-weight: 600;
        color: #111827;
    }

    .user-phone {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .step-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-secondary {
        background: #e5e7eb;
        color: #374151;
    }

    .btn-primary {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #374151;
    }
</style>
