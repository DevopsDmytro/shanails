<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authStore } from "../../stores/auth";
    import { getMyAppointments, type Appointment } from "$lib/api";
    import BookingCard from "$lib/components/BookingCard.svelte";
    import { get } from "svelte/store";

    let appointments: Appointment[] = [];
    let loading = true;
    let error: string | null = null;
    let activeTab: "upcoming" | "past" = "upcoming";

    $: upcomingAppointments = appointments.filter(
        (a) => new Date(a.start_time) > new Date() && a.status === "SCHEDULED",
    );
    $: pastAppointments = appointments.filter(
        (a) => new Date(a.start_time) <= new Date() || a.status !== "SCHEDULED",
    );

    onMount(async () => {
        const currentUser = get(authStore).user;
        if (!currentUser) {
            goto("/login");
            return;
        }

        await loadAppointments();
    });

    async function loadAppointments() {
        try {
            loading = true;
            const response = await getMyAppointments();
            appointments = response.appointments;
        } catch (err: any) {
            error = err.message || "Failed to load appointments";
        } finally {
            loading = false;
        }
    }

    function handleRefresh() {
        loadAppointments();
    }
</script>

<div class="my-bookings-container">
    <div class="header">
        <h1>Мої записи</h1>
        <button class="refresh-btn" on:click={handleRefresh} disabled={loading}>
            {loading ? "⌛" : "🔄"}
        </button>
    </div>

    {#if error}
        <div class="error-message">
            <p>❌ {error}</p>
            <button on:click={loadAppointments}>Спробувати знову</button>
        </div>
    {:else}
        <div class="tabs">
            <button
                class:active={activeTab === "upcoming"}
                on:click={() => (activeTab = "upcoming")}
            >
                Майбутні ({upcomingAppointments.length})
            </button>
            <button
                class:active={activeTab === "past"}
                on:click={() => (activeTab = "past")}
            >
                Минулі ({pastAppointments.length})
            </button>
        </div>

        <div class="bookings-list">
            {#if loading}
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Завантаження...</p>
                </div>
            {:else if activeTab === "upcoming"}
                {#if upcomingAppointments.length === 0}
                    <div class="empty-state">
                        <p>📅 У вас немає майбутніх записів</p>
                        <a href="/booking" class="book-btn">Записатися зараз</a>
                    </div>
                {:else}
                    {#each upcomingAppointments as appointment (appointment.id)}
                        <BookingCard {appointment} on:refresh={handleRefresh} />
                    {/each}
                {/if}
            {:else if pastAppointments.length === 0}
                <div class="empty-state">
                    <p>📋 У вас немає завершених записів</p>
                </div>
            {:else}
                {#each pastAppointments as appointment (appointment.id)}
                    <BookingCard
                        {appointment}
                        isPast={true}
                        on:refresh={handleRefresh}
                    />
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
    .my-bookings-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
    }

    .refresh-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        transition: transform 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
        transform: rotate(90deg);
    }

    .refresh-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .error-message {
        background: #fee;
        border: 1px solid #fcc;
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
    }

    .error-message p {
        color: #c00;
        margin-bottom: 1rem;
    }

    .error-message button {
        background: #c00;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
    }

    .tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid #e0e0e0;
    }

    .tabs button {
        background: none;
        border: none;
        padding: 1rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: #666;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
        margin-bottom: -2px;
    }

    .tabs button:hover {
        color: #333;
    }

    .tabs button.active {
        color: #7c3aed;
        border-bottom-color: #7c3aed;
    }

    .bookings-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .loading {
        text-align: center;
        padding: 3rem;
    }

    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #7c3aed;
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

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #666;
    }

    .empty-state p {
        font-size: 1.25rem;
        margin-bottom: 1.5rem;
    }

    .book-btn {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
    }

    .book-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    @media (max-width: 640px) {
        h1 {
            font-size: 1.5rem;
        }

        .tabs button {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
        }
    }
</style>
