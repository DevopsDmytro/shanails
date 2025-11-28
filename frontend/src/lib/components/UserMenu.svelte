<script lang="ts">
    import { authStore } from "../../stores/auth";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    let showMenu = false;
    const botUsername =
        import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "ShanailsBot";

    function toggleMenu() {
        showMenu = !showMenu;
    }

    function closeMenu() {
        showMenu = false;
    }

    function logout() {
        authStore.clearAuth();
        goto("/login");
    }

    function openTelegramBot() {
        // Open bot with deep link parameter to trigger linking flow
        window.open(`https://t.me/${botUsername}?start=link_web`, "_blank");
        closeMenu();
    }

    // Close menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (showMenu && !target.closest(".user-menu-container")) {
            closeMenu();
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="user-menu-container">
    <button class="user-profile-btn" on:click|stopPropagation={toggleMenu}>
        <div class="user-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
            </svg>
        </div>
        <span class="user-name">{$authStore.user?.name}</span>
        <svg
            class="chevron {showMenu ? 'open' : ''}"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
        >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
    </button>

    {#if showMenu}
        <div class="dropdown-menu">
            <div class="menu-header">
                <span class="user-email">{$authStore.user?.phone}</span>
            </div>

            <div class="menu-items">
                {#if $authStore.user?.telegram_id}
                    <div class="menu-item linked">
                        <span class="icon">✓</span>
                        Telegram Linked
                    </div>
                {:else}
                    <button
                        class="menu-item link-telegram"
                        on:click={openTelegramBot}
                    >
                        <span class="icon">🔗</span>
                        Link Telegram
                    </button>
                {/if}

                <hr />

                <button class="menu-item logout" on:click={logout}>
                    <span class="icon">🚪</span>
                    Logout
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .user-menu-container {
        position: relative;
    }

    .user-profile-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: #f0f2f5;
        border: none;
        border-radius: 20px;
        font-size: 0.9rem;
        color: #555;
        cursor: pointer;
        transition: background 0.2s;
    }

    .user-profile-btn:hover {
        background: #e4e6eb;
    }

    .user-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #007bff;
    }

    .chevron {
        transition: transform 0.2s;
    }

    .chevron.open {
        transform: rotate(180deg);
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 200px;
        z-index: 1000;
        overflow: hidden;
    }

    .menu-header {
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
    }

    .user-email {
        display: block;
        font-size: 0.8rem;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .menu-items {
        padding: 8px 0;
    }

    .menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px 16px;
        border: none;
        background: none;
        text-align: left;
        font-size: 0.9rem;
        color: #333;
        cursor: pointer;
        transition: background 0.2s;
    }

    .menu-item:hover {
        background: #f0f2f5;
    }

    .menu-item.linked {
        color: #28a745;
        cursor: default;
    }

    .menu-item.link-telegram {
        color: #d63384;
        font-weight: 500;
    }

    .menu-item.logout {
        color: #dc3545;
    }

    hr {
        margin: 4px 0;
        border: none;
        border-top: 1px solid #eee;
    }
</style>
