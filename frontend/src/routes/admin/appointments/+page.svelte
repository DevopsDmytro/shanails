<script lang="ts">
    import { onMount } from "svelte";
    import type { Appointment } from "$lib/api";

    let appointments: Appointment[] = [];
    let loading = true;
    let error: string | null = null;

    // Filters
    let statusFilter = "";
    let masterFilter = "";
    let searchQuery = "";
    let dateFrom = "";
    let dateTo = "";

    // Pagination
    let currentPage = 1;
    let totalPages = 1;
    let itemsPerPage = 20;

    // Available filters
    let masters: Array<{ id: number; name: string }> = [];
    const statuses = ["SCHEDULED", "COMPLETED", "CANCELLED"];

    onMount(async () => {
        await loadAppointments();
        await loadMasters();
    });

    async function loadAppointments() {
        try {
            loading = true;
            // TODO: Connect to /api/v1/admin/appointments
            // const response = await fetch('/api/v1/admin/appointments?...');
            // For now, using placeholder
            appointments = [];
        } catch (err: any) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function loadMasters() {
        try {
            // TODO: Connect to /api/v1/admin/masters
            masters = [];
        } catch (err) {
            console.error("Failed to load masters", err);
        }
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    function formatTime(dateString: string): string {
        return new Date(dateString).toLocaleTimeString("uk-UA", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getStatusClass(status: string): string {
        switch (status) {
            case "SCHEDULED":
                return "status-scheduled";
            case "COMPLETED":
                return "status-completed";
            case "CANCELLED":
                return "status-cancelled";
            default:
                return "status-default";
        }
    }

    function getStatusLabel(status: string): string {
        switch (status) {
            case "SCHEDULED":
                return "Заплановано";
            case "COMPLETED":
                return "Завершено";
            case "CANCELLED":
                return "Скасовано";
            default:
                return status;
        }
    }

    function handleSearch() {
        currentPage = 1;
        loadAppointments();
    }

    function clearFilters() {
        statusFilter = "";
        masterFilter = "";
        searchQuery = "";
        dateFrom = "";
        dateTo = "";
        handleSearch();
    }
</script>

<div class="appointments-page">
    <div class="page-header">
        <div>
            <h2>Керування Записами</h2>
            <p>Переглядайте та керуйте всіма записами салону</p>
        </div>
        <button class="btn btn-primary">
            <span class="btn-icon">➕</span>
            Новий запис
        </button>
    </div>

    <!-- Filters -->
    <div class="filters-section">
        <div class="filters-row">
            <div class="filter-group">
                <label for="searchQuery">Пошук клієнта</label>
                <input
                    id="searchQuery"
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Ім'я або телефон..."
                    on:input={handleSearch}
                />
            </div>

            <div class="filter-group">
                <label for="statusFilter">Статус</label>
                <select
                    id="statusFilter"
                    bind:value={statusFilter}
                    on:change={handleSearch}
                >
                    <option value="">Всі статуси</option>
                    {#each statuses as status}
                        <option value={status}>{getStatusLabel(status)}</option>
                    {/each}
                </select>
            </div>

            <div class="filter-group">
                <label for="masterFilter">Майстер</label>
                <select
                    id="masterFilter"
                    bind:value={masterFilter}
                    on:change={handleSearch}
                >
                    <option value="">Всі майстри</option>
                    {#each masters as master}
                        <option value={master.id}>{master.name}</option>
                    {/each}
                </select>
            </div>

            <div class="filter-group">
                <label for="dateFrom">Від дати</label>
                <input
                    id="dateFrom"
                    type="date"
                    bind:value={dateFrom}
                    on:change={handleSearch}
                />
            </div>

            <div class="filter-group">
                <label for="dateTo">До дати</label>
                <input
                    id="dateTo"
                    type="date"
                    bind:value={dateTo}
                    on:change={handleSearch}
                />
            </div>

            <div class="filter-actions">
                <button class="btn btn-secondary" on:click={clearFilters}
                    >Очистити</button
                >
            </div>
        </div>
    </div>

    <!-- Table -->
    <div class="table-container">
        {#if loading}
            <div class="loading">
                <div class="spinner"></div>
                <p>Завантаження записів...</p>
            </div>
        {:else if error}
            <div class="error">
                <p>❌ {error}</p>
                <button class="btn btn-primary" on:click={loadAppointments}
                    >Спробувати знову</button
                >
            </div>
        {:else if appointments.length === 0}
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>Записів не знайдено</h3>
                <p>Спробуйте змінити фільтри або створіть новий запис</p>
            </div>
        {:else}
            <table class="appointments-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Клієнт</th>
                        <th>Майстер</th>
                        <th>Дата</th>
                        <th>Час</th>
                        <th>Послуги</th>
                        <th>Вартість</th>
                        <th>Статус</th>
                        <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
                    {#each appointments as appointment}
                        <tr>
                            <td class="id-cell">#{appointment.id}</td>
                            <td>
                                <div class="client-info">
                                    <div class="client-name">
                                        {appointment.user.name}
                                    </div>
                                    <div class="client-phone">
                                        {appointment.user.phone || "—"}
                                    </div>
                                </div>
                            </td>
                            <td>{appointment.master.name}</td>
                            <td>{formatDate(appointment.start_time)}</td>
                            <td>{formatTime(appointment.start_time)}</td>
                            <td>
                                <div class="services-list">
                                    {#each appointment.services as service}
                                        <span class="service-badge"
                                            >{service.name}</span
                                        >
                                    {/each}
                                </div>
                            </td>
                            <td class="price-cell"
                                >{appointment.total_price} грн</td
                            >
                            <td>
                                <span
                                    class="status-badge {getStatusClass(
                                        appointment.status,
                                    )}"
                                >
                                    {getStatusLabel(appointment.status)}
                                </span>
                            </td>
                            <td>
                                <div class="actions">
                                    <button
                                        class="action-btn"
                                        title="Переглянути">👁️</button
                                    >
                                    <button
                                        class="action-btn"
                                        title="Редагувати">✏️</button
                                    >
                                    <button
                                        class="action-btn danger"
                                        title="Скасувати">❌</button
                                    >
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>

            <!-- Pagination -->
            <div class="pagination">
                <button
                    class="btn btn-secondary"
                    disabled={currentPage === 1}
                    on:click={() => (currentPage -= 1)}
                >
                    ← Попередня
                </button>
                <span class="page-info"
                    >Сторінка {currentPage} з {totalPages}</span
                >
                <button
                    class="btn btn-secondary"
                    disabled={currentPage === totalPages}
                    on:click={() => (currentPage += 1)}
                >
                    Наступна →
                </button>
            </div>
        {/if}
    </div>
</div>

<style>
    .appointments-page {
        max-width: 1400px;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
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

    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9375rem;
    }

    .btn-primary {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
    }

    .btn-secondary {
        background: #e5e7eb;
        color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #d1d5db;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-icon {
        font-size: 1.125rem;
    }

    .filters-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .filters-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        align-items: end;
    }

    .filter-group label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    .filter-group input,
    .filter-group select {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.9375rem;
        transition: border-color 0.2s;
    }

    .filter-group input:focus,
    .filter-group select:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }

    .table-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .loading,
    .error,
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
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

    .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .empty-state h3 {
        color: #111827;
        margin: 0 0 0.5rem;
    }

    .empty-state p {
        color: #6b7280;
    }

    .appointments-table {
        width: 100%;
        border-collapse: collapse;
    }

    .appointments-table thead {
        background: #f9fafb;
        border-bottom: 2px solid #e5e7eb;
    }

    .appointments-table th {
        text-align: left;
        padding: 1rem;
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .appointments-table td {
        padding: 1rem;
        border-bottom: 1px solid #f3f4f6;
    }

    .appointments-table tbody tr:hover {
        background: #f9fafb;
    }

    .id-cell {
        color: #6b7280;
        font-weight: 600;
        font-size: 0.875rem;
    }

    .client-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .client-name {
        font-weight: 600;
        color: #111827;
    }

    .client-phone {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .services-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
    }

    .service-badge {
        background: #ede9fe;
        color: #7c3aed;
        padding: 0.25rem 0.625rem;
        border-radius: 12px;
        font-size: 0.8125rem;
        font-weight: 500;
    }

    .price-cell {
        font-weight: 700;
        color: #059669;
        font-size: 1rem;
    }

    .status-badge {
        padding: 0.375rem 0.75rem;
        border-radius: 16px;
        font-size: 0.8125rem;
        font-weight: 600;
        display: inline-block;
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

    .actions {
        display: flex;
        gap: 0.5rem;
    }

    .action-btn {
        background: #f3f4f6;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1rem;
    }

    .action-btn:hover {
        background: #e5e7eb;
        transform: scale(1.1);
    }

    .action-btn.danger:hover {
        background: #fee2e2;
    }

    .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    .page-info {
        color: #6b7280;
        font-weight: 600;
    }

    @media (max-width: 1200px) {
        .appointments-table {
            display: block;
            overflow-x: auto;
        }
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 1rem;
        }

        .filters-row {
            grid-template-columns: 1fr;
        }
    }
</style>
