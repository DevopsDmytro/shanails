<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { authStore } from "../../stores/auth";
    import { get } from "svelte/store";

    let sidebarOpen = true;

    // Protect admin routes
    onMount(() => {
        const currentUser = get(authStore).user;
        if (!currentUser || currentUser.role !== "ADMIN") {
            goto("/");
        }
    });

    const menuItems = [
        { path: "/admin", icon: "📊", label: "Огляд" },
        { path: "/admin/appointments", icon: "📅", label: "Записи" },
        { path: "/admin/clients", icon: "👥", label: "Клієнти" },
        { path: "/admin/masters", icon: "✂️", label: "Майстри" },
        { path: "/admin/services", icon: "✨", label: "Послуги" },
        { path: "/admin/schedule", icon: "🕐", label: "Розклад" },
        { path: "/admin/reports", icon: "📈", label: "Звіти" },
    ];

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }

    function logout() {
        authStore.clearAuth();
        goto("/login");
    }
</script>

<div class="admin-container">
    <!-- Sidebar -->
    <aside class="sidebar" class:collapsed={!sidebarOpen}>
        <div class="sidebar-header">
            <h2>Адмін Панель</h2>
            <button class="toggle-btn" on:click={toggleSidebar}>
                {sidebarOpen ? "◀" : "▶"}
            </button>
        </div>

        <nav class="sidebar-nav">
            {#each menuItems as item}
                <a
                    href={item.path}
                    class="nav-item"
                    class:active={$page.url.pathname === item.path}
                >
                    <span class="nav-icon">{item.icon}</span>
                    {#if sidebarOpen}
                        <span class="nav-label">{item.label}</span>
                    {/if}
                </a>
            {/each}
        </nav>

        <div class="sidebar-footer">
            <button class="logout-btn" on:click={logout}>
                <span class="nav-icon">🚪</span>
                {#if sidebarOpen}
                    <span>Вийти</span>
                {/if}
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
        <header class="admin-header">
            <div class="header-left">
                <h1 class="page-title">
                    {menuItems.find((item) => item.path === $page.url.pathname)
                        ?.label || "Адмін"}
                </h1>
            </div>
            <div class="header-right">
                {#if $authStore.user}
                    <div class="user-info">
                        <span class="user-icon">👤</span>
                        <span class="user-name">{$authStore.user.name}</span>
                        <span class="admin-badge">ADMIN</span>
                    </div>
                {/if}
            </div>
        </header>

        <main class="content">
            <slot />
        </main>
    </div>
</div>

<style>
    .admin-container {
        display: flex;
        min-height: 100vh;
        background: #f3f4f6;
    }

    .sidebar {
        width: 260px;
        background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
        color: white;
        display: flex;
        flex-direction: column;
        transition: width 0.3s;
        position: sticky;
        top: 0;
        height: 100vh;
    }

    .sidebar.collapsed {
        width: 70px;
    }

    .sidebar-header {
        padding: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .sidebar-header h2 {
        font-size: 1.25rem;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
    }

    .sidebar.collapsed .sidebar-header h2 {
        display: none;
    }

    .toggle-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .toggle-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .sidebar-nav {
        flex: 1;
        padding: 1rem 0;
        overflow-y: auto;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.875rem 1.5rem;
        color: #d1d5db;
        text-decoration: none;
        transition: all 0.2s;
        position: relative;
    }

    .sidebar.collapsed .nav-item {
        justify-content: center;
        padding: 0.875rem 0;
    }

    .nav-item:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .nav-item.active {
        background: rgba(124, 58, 237, 0.2);
        color: white;
        border-left: 3px solid #7c3aed;
    }

    .nav-icon {
        font-size: 1.5rem;
        min-width: 1.5rem;
        text-align: center;
    }

    .nav-label {
        white-space: nowrap;
    }

    .sidebar.collapsed .nav-label {
        display: none;
    }

    .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logout-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.875rem 1rem;
        background: rgba(220, 38, 38, 0.2);
        border: none;
        color: #fca5a5;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 600;
    }

    .sidebar.collapsed .logout-btn {
        justify-content: center;
        padding: 0.875rem 0;
    }

    .logout-btn:hover {
        background: rgba(220, 38, 38, 0.3);
        color: white;
    }

    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .admin-header {
        background: white;
        padding: 1.5rem 2rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        z-index: 10;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .page-title {
        margin: 0;
        font-size: 1.75rem;
        color: #111827;
        font-weight: 700;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: #f3f4f6;
        padding: 0.5rem 1rem;
        border-radius: 20px;
    }

    .user-icon {
        font-size: 1.25rem;
    }

    .user-name {
        font-weight: 600;
        color: #374151;
    }

    .admin-badge {
        background: #7c3aed;
        color: white;
        padding: 0.25rem 0.625rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .content {
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
    }

    @media (max-width: 768px) {
        .sidebar {
            position: fixed;
            z-index: 100;
            transform: translateX(0);
        }

        .sidebar.collapsed {
            transform: translateX(-100%);
        }

        .main-content {
            margin-left: 0;
        }

        .content {
            padding: 1rem;
        }

        .admin-header {
            padding: 1rem;
        }

        .page-title {
            font-size: 1.25rem;
        }
    }
</style>
