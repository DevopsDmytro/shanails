<script lang="ts">
    import { onMount } from "svelte";

    // Placeholder for stats - will connect to API later
    let stats = {
        total_users: 0,
        total_masters: 0,
        today_appointments: 0,
        active_appointments: 0,
        total_revenue: 0,
    };

    let loading = true;

    onMount(async () => {
        // TODO: Fetch stats from /api/v1/admin/stats
        // For now, using placeholder data
        setTimeout(() => {
            stats = {
                total_users: 0,
                total_masters: 0,
                today_appointments: 0,
                active_appointments: 0,
                total_revenue: 0,
            };
            loading = false;
        }, 500);
    });
</script>

<div class="dashboard">
    <div class="welcome-section">
        <h2>Вітаємо в адмін панелі!</h2>
        <p>Керуйте салоном з єдиного місця</p>
    </div>

    {#if loading}
        <div class="loading">
            <div class="spinner"></div>
            <p>Завантаження статистики...</p>
        </div>
    {:else}
        <div class="stats-grid">
            <div class="stat-card blue">
                <div class="stat-icon">👥</div>
                <div class="stat-content">
                    <div class="stat-value">{stats.total_users}</div>
                    <div class="stat-label">Користувачів</div>
                </div>
            </div>

            <div class="stat-card purple">
                <div class="stat-icon">✂️</div>
                <div class="stat-content">
                    <div class="stat-value">{stats.total_masters}</div>
                    <div class="stat-label">Активних майстрів</div>
                </div>
            </div>

            <div class="stat-card green">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <div class="stat-value">{stats.today_appointments}</div>
                    <div class="stat-label">Записів сьогодні</div>
                </div>
            </div>

            <div class="stat-card orange">
                <div class="stat-icon">⏰</div>
                <div class="stat-content">
                    <div class="stat-value">{stats.active_appointments}</div>
                    <div class="stat-label">Активних записів</div>
                </div>
            </div>

            <div class="stat-card teal">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-value">
                        {stats.total_revenue.toLocaleString()} грн
                    </div>
                    <div class="stat-label">Загальний дохід</div>
                </div>
            </div>
        </div>

        <div class="quick-actions">
            <h3>Швидкі дії</h3>
            <div class="actions-grid">
                <a href="/admin/appointments" class="action-card">
                    <span class="action-icon">📅</span>
                    <span class="action-label">Переглянути записи</span>
                </a>
                <a href="/admin/clients" class="action-card">
                    <span class="action-icon">👤</span>
                    <span class="action-label">Керувати клієнтами</span>
                </a>
                <a href="/admin/masters" class="action-card">
                    <span class="action-icon">✂️</span>
                    <span class="action-label">Керувати майстрами</span>
                </a>
                <a href="/admin/services" class="action-card">
                    <span class="action-icon">✨</span>
                    <span class="action-label">Керувати послугами</span>
                </a>
                <a href="/admin/schedule" class="action-card">
                    <span class="action-icon">🕐</span>
                    <span class="action-label">Налаштувати розклад</span>
                </a>
                <a href="/admin/reports" class="action-card">
                    <span class="action-icon">📈</span>
                    <span class="action-label">Переглянути звіти</span>
                </a>
            </div>
        </div>
    {/if}
</div>

<style>
    .dashboard {
        max-width: 1400px;
    }

    .welcome-section {
        margin-bottom: 2rem;
    }

    .welcome-section h2 {
        font-size: 2rem;
        color: #111827;
        margin: 0 0 0.5rem;
    }

    .welcome-section p {
        color: #6b7280;
        font-size: 1.125rem;
        margin: 0;
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
        margin-bottom: 3rem;
    }

    .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition:
            transform 0.2s,
            box-shadow 0.2s;
    }

    .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
        font-size: 3rem;
        width: 80px;
        height: 80px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .stat-card.blue .stat-icon {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .stat-card.purple .stat-icon {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    }

    .stat-card.green .stat-icon {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .stat-card.orange .stat-icon {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .stat-card.teal .stat-icon {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    }

    .stat-content {
        flex: 1;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        line-height: 1.2;
    }

    .stat-label {
        color: #6b7280;
        font-size: 0.9375rem;
        margin-top: 0.25rem;
    }

    .quick-actions {
        margin-top: 3rem;
    }

    .quick-actions h3 {
        font-size: 1.5rem;
        color: #111827;
        margin: 0 0 1.5rem;
    }

    .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }

    .action-card {
        background: white;
        border-radius: 10px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        transition: all 0.2s;
        border: 2px solid transparent;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .action-card:hover {
        transform: translateY(-4px);
        border-color: #7c3aed;
        box-shadow: 0 8px 16px rgba(124, 58, 237, 0.2);
    }

    .action-icon {
        font-size: 2.5rem;
    }

    .action-label {
        color: #374151;
        font-weight: 600;
        text-align: center;
        font-size: 0.9375rem;
    }

    @media (max-width: 768px) {
        .stats-grid {
            grid-template-columns: 1fr;
        }

        .actions-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .welcome-section h2 {
            font-size: 1.5rem;
        }
    }
</style>
