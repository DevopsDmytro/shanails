<script lang="ts">
    import { onMount } from "svelte";

    interface Master {
        id: number;
        user_id: number;
        name: string;
        specialization: string;
        description: string | null;
        photo_url: string | null;
        is_active: boolean;
        created_at: string;
    }

    let masters: Master[] = [];
    let loading = true;
    let error: string | null = null;
    let searchQuery = "";
    let activeFilter = "";

    onMount(async () => {
        await loadMasters();
    });

    async function loadMasters() {
        try {
            loading = true;
            // TODO: Connect to /api/v1/admin/masters
            masters = [];
        } catch (err: any) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    function handleSearch() {
        loadMasters();
    }

    function clearFilters() {
        searchQuery = "";
        activeFilter = "";
        handleSearch();
    }
</script>

<div class="masters-page">
    <div class="page-header">
        <div>
            <h2>Керування Майстрами</h2>
            <p>Додавайте та редагуйте професійних майстрів салону</p>
        </div>
        <button class="btn btn-primary">
            <span class="btn-icon">➕</span>
            Додати майстра
        </button>
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
                    placeholder="Ім'я або спеціалізація..."
                    on:input={handleSearch}
                />
            </div>

            <div class="filter-group">
                <label for="activeFilter">Статус</label>
                <select
                    id="activeFilter"
                    bind:value={activeFilter}
                    on:change={handleSearch}
                >
                    <option value="">Всі майстри</option>
                    <option value="true">Активні</option>
                    <option value="false">Неактивні</option>
                </select>
            </div>

            <div class="filter-actions">
                <button class="btn btn-secondary" on:click={clearFilters}
                    >Очистити</button
                >
            </div>
        </div>
    </div>

    <!-- Masters Grid -->
    <div class="content-container">
        {#if loading}
            <div class="loading">
                <div class="spinner"></div>
                <p>Завантаження майстрів...</p>
            </div>
        {:else if error}
            <div class="error">
                <p>❌ {error}</p>
                <button class="btn btn-primary" on:click={loadMasters}
                    >Спробувати знову</button
                >
            </div>
        {:else if masters.length === 0}
            <div class="empty-state">
                <div class="empty-icon">✂️</div>
                <h3>Майстрів не знайдено</h3>
                <p>Додайте першого майстра для початку роботи</p>
                <button class="btn btn-primary">
                    <span class="btn-icon">➕</span>
                    Додати майстра
                </button>
            </div>
        {:else}
            <div class="masters-grid">
                {#each masters as master}
                    <div class="master-card">
                        <div class="card-header">
                            <div class="master-avatar">
                                {#if master.photo_url}
                                    <img
                                        src={master.photo_url}
                                        alt={master.name}
                                    />
                                {:else}
                                    <div class="avatar-placeholder">✂️</div>
                                {/if}
                            </div>
                            <div class="status-toggle">
                                <label class="switch">
                                    <input
                                        type="checkbox"
                                        checked={master.is_active}
                                    />
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="card-body">
                            <h3 class="master-name">{master.name}</h3>
                            <p class="master-specialization">
                                {master.specialization}
                            </p>
                            {#if master.description}
                                <p class="master-description">
                                    {master.description}
                                </p>
                            {/if}
                        </div>

                        <div class="card-footer">
                            <div class="master-meta">
                                <span class="meta-item"
                                    >📅 {formatDate(master.created_at)}</span
                                >
                                <span class="meta-item">ID: #{master.id}</span>
                            </div>
                            <div class="card-actions">
                                <button class="action-btn" title="Редагувати"
                                    >✏️</button
                                >
                                <button class="action-btn" title="Розклад"
                                    >📅</button
                                >
                                <button
                                    class="action-btn danger"
                                    title="Видалити">🗑️</button
                                >
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .masters-page {
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

    .content-container {
        min-height: 400px;
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

    .masters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
    }

    .master-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: all 0.2s;
    }

    .master-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .card-header {
        position: relative;
        padding: 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        justify-content: center;
    }

    .master-avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        overflow: hidden;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .master-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .avatar-placeholder {
        width: 100%;
        height: 100%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
    }

    .status-toggle {
        position: absolute;
        top: 1rem;
        right: 1rem;
    }

    .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 28px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.3);
        transition: 0.3s;
        border-radius: 28px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: #10b981;
    }

    input:checked + .slider:before {
        transform: translateX(22px);
    }

    .card-body {
        padding: 1.5rem;
        text-align: center;
    }

    .master-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 0.5rem;
    }

    .master-specialization {
        color: #7c3aed;
        font-weight: 600;
        margin: 0 0 0.75rem;
    }

    .master-description {
        color: #6b7280;
        font-size: 0.9375rem;
        line-height: 1.5;
        margin: 0;
    }

    .card-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid #f3f4f6;
        background: #f9fafb;
    }

    .master-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
    }

    .meta-item {
        font-size: 0.8125rem;
        color: #6b7280;
    }

    .card-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }

    .action-btn {
        background: white;
        border: 1px solid #e5e7eb;
        width: 36px;
        height: 36px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1rem;
    }

    .action-btn:hover {
        background: #f3f4f6;
        transform: scale(1.1);
    }

    .action-btn.danger:hover {
        background: #fee2e2;
        border-color: #fca5a5;
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 1rem;
        }

        .filters-row {
            grid-template-columns: 1fr;
        }

        .masters-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
