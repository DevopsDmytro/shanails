<script lang="ts">
    import { onMount } from "svelte";

    interface Client {
        id: number;
        name: string;
        phone: string | null;
        telegram_id: number;
        role: string;
        is_registered: boolean;
        cancellations_this_year: number;
        notes: string | null;
        created_at: string;
    }

    let clients: Client[] = [];
    let loading = true;
    let error: string | null = null;
    let searchQuery = "";
    let roleFilter = "";

    // Pagination
    let currentPage = 1;
    let totalPages = 1;
    let totalClients = 0;

    onMount(async () => {
        await loadClients();
    });

    async function loadClients() {
        try {
            loading = true;
            // TODO: Connect to /api/v1/admin/users
            // const response = await fetch('/api/v1/admin/users?search=...');
            // For now, placeholder
            clients = [];
            totalClients = 0;
        } catch (err: any) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function handleSearch() {
        currentPage = 1;
        loadClients();
    }

    function clearFilters() {
        searchQuery = "";
        roleFilter = "";
        handleSearch();
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }
</script>

<div class="clients-page">
    <div class="page-header">
        <div>
            <h2>Керування Клієнтами</h2>
            <p>Переглядайте та керуйте клієнтами салону</p>
        </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
        <div class="filters-row">
            <div class="filter-group">
                <label for="searchQuery">Пошук</label>
                <input
                    id="searchQuery"
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Ім'я або телефон..."
                    on:input={handleSearch}
                />
            </div>

            <div class="filter-group">
                <label for="roleFilter">Роль</label>
                <select
                    id="roleFilter"
                    bind:value={roleFilter}
                    on:change={handleSearch}
                >
                    <option value="">Всі ролі</option>
                    <option value="CLIENT">Клієнт</option>
                    <option value="ADMIN">Адміністратор</option>
                </select>
            </div>

            <div class="filter-actions">
                <button class="btn btn-secondary" on:click={clearFilters}
                    >Очистити</button
                >
            </div>
        </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
        <div class="stat-card">
            <div class="stat-label">Всього клієнтів</div>
            <div class="stat-value">{totalClients}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Зареєстрованих</div>
            <div class="stat-value">
                {clients.filter((c) => c.is_registered).length}
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Активних</div>
            <div class="stat-value">
                {clients.filter((c) => c.cancellations_this_year < 3).length}
            </div>
        </div>
    </div>

    <!-- Table -->
    <div class="table-container">
        {#if loading}
            <div class="loading">
                <div class="spinner"></div>
                <p>Завантаження клієнтів...</p>
            </div>
        {:else if error}
            <div class="error">
                <p>❌ {error}</p>
                <button class="btn btn-primary" on:click={loadClients}
                    >Спробувати знову</button
                >
            </div>
        {:else if clients.length === 0}
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>Клієнтів не знайдено</h3>
                <p>Спробуйте змінити фільтри пошуку</p>
            </div>
        {:else}
            <table class="clients-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Клієнт</th>
                        <th>Контакти</th>
                        <th>Роль</th>
                        <th>Скасувань</th>
                        <th>Зареєстрований</th>
                        <th>Дата реєстрації</th>
                        <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
                    {#each clients as client}
                        <tr>
                            <td class="id-cell">#{client.id}</td>
                            <td>
                                <div class="client-info">
                                    <div class="client-name">{client.name}</div>
                                    <div class="client-telegram">
                                        TG ID: {client.telegram_id}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="contact-info">
                                    {#if client.phone}
                                        <a
                                            href="tel:{client.phone}"
                                            class="phone-link"
                                        >
                                            📞 {client.phone}
                                        </a>
                                    {:else}
                                        <span class="no-phone">—</span>
                                    {/if}
                                </div>
                            </td>
                            <td>
                                <span
                                    class="role-badge"
                                    class:admin={client.role === "ADMIN"}
                                >
                                    {client.role === "ADMIN"
                                        ? "Адмін"
                                        : "Клієнт"}
                                </span>
                            </td>
                            <td>
                                <span
                                    class="cancellation-badge"
                                    class:warning={client.cancellations_this_year >=
                                        2}
                                    class:danger={client.cancellations_this_year >=
                                        3}
                                >
                                    {client.cancellations_this_year} / 3
                                </span>
                            </td>
                            <td>
                                {#if client.is_registered}
                                    <span class="status-yes">✓ Так</span>
                                {:else}
                                    <span class="status-no">✗ Ні</span>
                                {/if}
                            </td>
                            <td class="date-cell"
                                >{formatDate(client.created_at)}</td
                            >
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
                                        class="action-btn"
                                        title="Скинути ліміти">🔄</button
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
    .clients-page {
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

    .filters-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .filters-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    }

    .filter-group input:focus,
    .filter-group select:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }

    .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .stat-card {
        background: white;
        border-radius: 10px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
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
    }

    .btn-primary {
        background: #7c3aed;
        color: white;
    }

    .btn-secondary {
        background: #e5e7eb;
        color: #374151;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

    .clients-table {
        width: 100%;
        border-collapse: collapse;
    }

    .clients-table thead {
        background: #f9fafb;
        border-bottom: 2px solid #e5e7eb;
    }

    .clients-table th {
        text-align: left;
        padding: 1rem;
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .clients-table td {
        padding: 1rem;
        border-bottom: 1px solid #f3f4f6;
    }

    .clients-table tbody tr:hover {
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

    .client-telegram {
        font-size: 0.8125rem;
        color: #6b7280;
    }

    .phone-link {
        color: #7c3aed;
        text-decoration: none;
        font-weight: 500;
    }

    .phone-link:hover {
        text-decoration: underline;
    }

    .no-phone {
        color: #9ca3af;
    }

    .role-badge {
        background: #dbeafe;
        color: #1e40af;
        padding: 0.375rem 0.75rem;
        border-radius: 16px;
        font-size: 0.8125rem;
        font-weight: 600;
        display: inline-block;
    }

    .role-badge.admin {
        background: #fef3c7;
        color: #92400e;
    }

    .cancellation-badge {
        background: #d1fae5;
        color: #065f46;
        padding: 0.375rem 0.75rem;
        border-radius: 16px;
        font-size: 0.8125rem;
        font-weight: 600;
        display: inline-block;
    }

    .cancellation-badge.warning {
        background: #fed7aa;
        color: #92400e;
    }

    .cancellation-badge.danger {
        background: #fee2e2;
        color: #991b1b;
    }

    .status-yes {
        color: #059669;
        font-weight: 600;
    }

    .status-no {
        color: #9ca3af;
    }

    .date-cell {
        color: #6b7280;
        font-size: 0.9375rem;
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

    @media (max-width: 768px) {
        .filters-row,
        .stats-row {
            grid-template-columns: 1fr;
        }

        .clients-table {
            display: block;
            overflow-x: auto;
        }
    }
</style>
