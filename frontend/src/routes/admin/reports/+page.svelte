<script lang="ts">
    import { onMount } from "svelte";

    let dateFrom = "";
    let dateTo = "";
    let loading = false;

    let stats = {
        total_revenue: 0,
        total_appointments: 0,
        completed_appointments: 0,
        cancelled_appointments: 0,
        average_price: 0,
    };

    let popularServices: Array<{
        name: string;
        count: number;
        revenue: number;
    }> = [];
    let masterPerformance: Array<{
        name: string;
        appointments: number;
        revenue: number;
    }> = [];

    onMount(() => {
        // Set default dates (last 30 days)
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 30);

        dateTo = today.toISOString().split("T")[0];
        dateFrom = lastMonth.toISOString().split("T")[0];
    });

    async function loadReports() {
        loading = true;
        try {
            // TODO: Connect to /api/v1/admin/reports endpoints
            await new Promise((resolve) => setTimeout(resolve, 500));
        } finally {
            loading = false;
        }
    }
</script>

<div class="reports-page">
    <div class="page-header">
        <div>
            <h2>Звіти та Аналітика</h2>
            <p>Аналізуйте продуктивність та дохід салону</p>
        </div>
    </div>

    <div class="date-controls">
        <div class="control-group">
            <label for="dateFrom">Від дати</label>
            <input id="dateFrom" type="date" bind:value={dateFrom} />
        </div>
        <div class="control-group">
            <label for="dateTo">До дати</label>
            <input id="dateTo" type="date" bind:value={dateTo} />
        </div>
        <button class="btn btn-primary" on:click={loadReports}>
            Сформувати звіт
        </button>
    </div>

    {#if loading}
        <div class="loading">
            <div class="spinner"></div>
            <p>Формування звіту...</p>
        </div>
    {:else}
        <div class="stats-grid">
            <div class="stat-card revenue">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-value">
                        {stats.total_revenue.toLocaleString()} грн
                    </div>
                    <div class="stat-label">Загальний дохід</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <div class="stat-value">{stats.total_appointments}</div>
                    <div class="stat-label">Всього записів</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">✓</div>
                <div class="stat-content">
                    <div class="stat-value">{stats.completed_appointments}</div>
                    <div class="stat-label">Завершених</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">✗</div>
                <div class="stat-content">
                    <div class="stat-value">{stats.cancelled_appointments}</div>
                    <div class="stat-label">Скасованих</div>
                </div>
            </div>
        </div>

        <div class="reports-grid">
            <div class="report-card">
                <h3>Популярні Послуги</h3>
                {#if popularServices.length === 0}
                    <div class="no-data">
                        <p>📊 Немає даних за обраний період</p>
                    </div>
                {:else}
                    <div class="report-content">
                        {#each popularServices as service}
                            <div class="report-item">
                                <div class="item-info">
                                    <div class="item-name">{service.name}</div>
                                    <div class="item-meta">
                                        {service.count} записів
                                    </div>
                                </div>
                                <div class="item-value">
                                    {service.revenue.toLocaleString()} грн
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="report-card">
                <h3>Продуктивність Майстрів</h3>
                {#if masterPerformance.length === 0}
                    <div class="no-data">
                        <p>📊 Немає даних за обраний період</p>
                    </div>
                {:else}
                    <div class="report-content">
                        {#each masterPerformance as master}
                            <div class="report-item">
                                <div class="item-info">
                                    <div class="item-name">{master.name}</div>
                                    <div class="item-meta">
                                        {master.appointments} записів
                                    </div>
                                </div>
                                <div class="item-value">
                                    {master.revenue.toLocaleString()} грн
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <div class="placeholder">
            <div class="placeholder-icon">📈</div>
            <h3>Розширена аналітика в розробці</h3>
            <p>
                Скоро будуть доступні графіки, порівняння періодів та експорт
                звітів
            </p>
        </div>
    {/if}
</div>

<style>
    .reports-page {
        max-width: 1400px;
    }

    .page-header {
        margin-bottom: 2rem;
    }

    .page-header h2 {
        font-size: 1.75rem;
        color: #111827;
        margin: 0 0 0.5rem;
    }

    .page-header p {
        color: #6b7280;
        margin: 0;
    }

    .date-controls {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        display: flex;
        gap: 1rem;
        align-items: end;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .control-group {
        flex: 1;
    }

    .control-group label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    .control-group input {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.9375rem;
    }

    .btn {
        padding: 0.625rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white;
    }

    .loading {
        text-align: center;
        padding: 4rem;
    }

    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #7c3aed;
        border-radius: 50%;
        width: 50px;
        height: 50px;
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

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-card.revenue {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    }

    .stat-icon {
        font-size: 3rem;
        width: 80px;
        height: 80px;
        background: white;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .stat-content {
        flex: 1;
    }

    .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #111827;
        line-height: 1.2;
    }

    .stat-label {
        color: #6b7280;
        font-size: 0.9375rem;
        margin-top: 0.25rem;
    }

    .reports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .report-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .report-card h3 {
        font-size: 1.25rem;
        color: #111827;
        margin: 0 0 1.5rem;
    }

    .no-data {
        text-align: center;
        padding: 3rem 1rem;
    }

    .no-data p {
        color: #9ca3af;
        font-size: 1rem;
        margin: 0;
    }

    .report-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .report-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 8px;
    }

    .item-info {
        flex: 1;
    }

    .item-name {
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.25rem;
    }

    .item-meta {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .item-value {
        font-weight: 700;
        color: #059669;
        font-size: 1.125rem;
    }

    .placeholder {
        background: white;
        border-radius: 12px;
        padding: 4rem 2rem;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .placeholder-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .placeholder h3 {
        color: #111827;
        margin: 0 0 0.5rem;
    }

    .placeholder p {
        color: #6b7280;
        margin: 0;
    }

    @media (max-width: 768px) {
        .date-controls {
            flex-direction: column;
            align-items: stretch;
        }

        .stats-grid,
        .reports-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
