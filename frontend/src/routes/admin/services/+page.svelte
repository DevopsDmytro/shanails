<script lang="ts">
    import { onMount } from "svelte";

    interface Service {
        id: number;
        name: string;
        description: string | null;
        category: string | null;
        duration: number;
        price: number;
        image_url: string | null;
        is_active: boolean;
        is_popular: boolean;
        created_at: string;
    }

    let services: Service[] = [];
    let loading = true;
    let error: string | null = null;
    let searchQuery = "";
    let categoryFilter = "";
    let activeFilter = "";

    const categories = [
        "Манікюр",
        "Педикюр",
        "Стрижка",
        "Фарбування",
        "Укладка",
        "Масаж",
    ];

    onMount(async () => {
        await loadServices();
    });

    async function loadServices() {
        try {
            loading = true;
            // TODO: Connect to /api/v1/admin/services
            services = [];
        } catch (err: any) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function handleSearch() {
        loadServices();
    }

    function clearFilters() {
        searchQuery = "";
        categoryFilter = "";
        activeFilter = "";
        handleSearch();
    }
</script>

<div class="services-page">
    <div class="page-header">
        <div>
            <h2>Керування Послугами</h2>
            <p>Налаштуйте послуги та ціни салону</p>
        </div>
        <button class="btn btn-primary">
            <span class="btn-icon">➕</span>
            Додати послугу
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
                    placeholder="Назва послуги..."
                    on:input={handleSearch}
                />
            </div>

            <div class="filter-group">
                <label for="categoryFilter">Категорія</label>
                <select
                    id="categoryFilter"
                    bind:value={categoryFilter}
                    on:change={handleSearch}
                >
                    <option value="">Всі категорії</option>
                    {#each categories as category}
                        <option value={category}>{category}</option>
                    {/each}
                </select>
            </div>

            <div class="filter-group">
                <label for="activeFilter">Статус</label>
                <select
                    id="activeFilter"
                    bind:value={activeFilter}
                    on:change={handleSearch}
                >
                    <option value="">Всі послуги</option>
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

    <!-- Services Grid -->
    <div class="content-container">
        {#if loading}
            <div class="loading">
                <div class="spinner"></div>
                <p>Завантаження послуг...</p>
            </div>
        {:else if error}
            <div class="error">
                <p>❌ {error}</p>
                <button class="btn btn-primary" on:click={loadServices}
                    >Спробувати знову</button
                >
            </div>
        {:else if services.length === 0}
            <div class="empty-state">
                <div class="empty-icon">✨</div>
                <h3>Послуг не знайдено</h3>
                <p>Додайте першу послугу для початку роботи</p>
                <button class="btn btn-primary">
                    <span class="btn-icon">➕</span>
                    Додати послугу
                </button>
            </div>
        {:else}
            <div class="services-grid">
                {#each services as service}
                    <div class="service-card">
                        {#if service.is_popular}
                            <div class="popular-badge">⭐ Популярна</div>
                        {/if}

                        <div class="card-header">
                            {#if service.image_url}
                                <img
                                    src={service.image_url}
                                    alt={service.name}
                                    class="service-image"
                                />
                            {:else}
                                <div class="image-placeholder">✨</div>
                            {/if}
                        </div>

                        <div class="card-body">
                            <div class="service-info">
                                <h3 class="service-name">{service.name}</h3>
                                {#if service.category}
                                    <span class="service-category"
                                        >{service.category}</span
                                    >
                                {/if}
                            </div>

                            {#if service.description}
                                <p class="service-description">
                                    {service.description}
                                </p>
                            {/if}

                            <div class="service-details">
                                <div class="detail-item">
                                    <span class="detail-icon">⏱️</span>
                                    <span class="detail-text"
                                        >{service.duration} хв</span
                                    >
                                </div>
                                <div class="detail-item price">
                                    <span class="detail-icon">💰</span>
                                    <span class="detail-text"
                                        >{service.price} грн</span
                                    >
                                </div>
                            </div>
                        </div>

                        <div class="card-footer">
                            <div class="status-row">
                                <label class="switch">
                                    <input
                                        type="checkbox"
                                        checked={service.is_active}
                                    />
                                    <span class="slider"></span>
                                </label>
                                <span class="status-label">
                                    {service.is_active
                                        ? "Активна"
                                        : "Неактивна"}
                                </span>
                            </div>

                            <div class="card-actions">
                                <button class="action-btn" title="Редагувати"
                                    >✏️</button
                                >
                                <button class="action-btn" title="Дублювати"
                                    >📋</button
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
    .services-page {
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

    .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .service-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: all 0.2s;
        position: relative;
    }

    .service-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .popular-badge {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
        padding: 0.375rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8125rem;
        font-weight: 700;
        z-index: 1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .card-header {
        height: 160px;
        background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .service-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .image-placeholder {
        font-size: 4rem;
        opacity: 0.5;
    }

    .card-body {
        padding: 1.5rem;
    }

    .service-info {
        margin-bottom: 0.75rem;
    }

    .service-name {
        font-size: 1.125rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 0.5rem;
    }

    .service-category {
        background: #ede9fe;
        color: #7c3aed;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.8125rem;
        font-weight: 600;
    }

    .service-description {
        color: #6b7280;
        font-size: 0.9375rem;
        line-height: 1.5;
        margin: 0 0 1rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .service-details {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: #f9fafb;
        border-radius: 8px;
    }

    .detail-item.price {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    }

    .detail-icon {
        font-size: 1.125rem;
    }

    .detail-text {
        font-weight: 600;
        color: #111827;
    }

    .card-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid #f3f4f6;
        background: #f9fafb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .status-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
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
        background-color: #d1d5db;
        transition: 0.3s;
        border-radius: 24px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: #10b981;
    }

    input:checked + .slider:before {
        transform: translateX(20px);
    }

    .status-label {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 600;
    }

    .card-actions {
        display: flex;
        gap: 0.5rem;
    }

    .action-btn {
        background: white;
        border: 1px solid #e5e7eb;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9375rem;
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

        .services-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
