<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { authStore } from "../../stores/auth";

    let status = "linking"; // 'linking' | 'success' | 'error'
    let message = "Linking your Telegram account...";

    onMount(async () => {
        const token = $page.url.searchParams.get("token");
        if (!token) {
            status = "error";
            message = "Invalid link. Please try again from the Telegram bot.";
            return;
        }

        // Check if authenticated
        if (!$authStore.isAuthenticated) {
            const returnUrl = encodeURIComponent(
                $page.url.pathname + $page.url.search,
            );
            goto(`/login?returnUrl=${returnUrl}`);
            return;
        }

        try {
            const response = await fetch(
                `/api/v1/auth/link-telegram?token=${token}`,
                {
                    headers: {
                        Authorization: `Bearer ${$authStore.token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (response.ok) {
                status = "success";
                message = "✓ Telegram account linked successfully!";

                // Refresh user profile to get updated telegram_id
                import("../../services/auth").then(({ initAuth }) => {
                    initAuth();
                });

                setTimeout(() => goto("/"), 2000);
            } else {
                const error = await response.json();
                status = "error";
                message = error.detail || "Linking failed";
            }
        } catch (err) {
            status = "error";
            message =
                "Connection error. Please check your internet connection.";
        }
    });
</script>

<div class="linking-container">
    <div class="status-card {status}">
        <div class="icon">
            {#if status === "linking"}
                🔄
            {:else if status === "success"}
                ✅
            {:else}
                ❌
            {/if}
        </div>
        <h1>{message}</h1>
        {#if status === "error"}
            <button on:click={() => goto("/")}>Go Home</button>
        {/if}
    </div>
</div>

<style>
    .linking-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
        padding: 20px;
    }

    .status-card {
        background: white;
        padding: 40px;
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 400px;
        width: 100%;
    }

    .icon {
        font-size: 48px;
        margin-bottom: 20px;
    }

    h1 {
        font-size: 1.2rem;
        color: #333;
        margin-bottom: 20px;
    }

    .status-card.success h1 {
        color: #28a745;
    }

    .status-card.error h1 {
        color: #dc3545;
    }

    button {
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
    }
</style>
