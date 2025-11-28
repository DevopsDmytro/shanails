<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { verifyEmail } from "$lib/api";

    let loading = true;
    let success = false;
    let error = "";
    let message = "";

    onMount(async () => {
        const token = $page.url.searchParams.get("token");

        if (!token) {
            error = "Invalid verification link";
            loading = false;
            return;
        }

        try {
            const response = await verifyEmail(token);
            message = response.message;
            success = true;

            // Redirect to login after 3 seconds
            setTimeout(() => {
                goto("/login");
            }, 3000);
        } catch (err: any) {
            error = err.message || "Verification failed";
        } finally {
            loading = false;
        }
    });
</script>

<div class="container">
    <div class="card">
        {#if loading}
            <div class="loading">
                <div class="spinner"></div>
                <p>Verifying your email...</p>
            </div>
        {:else if success}
            <div class="success">
                <div class="icon">✅</div>
                <h1>Email Verified!</h1>
                <p>{message}</p>
                <p class="redirect">Redirecting to login...</p>
            </div>
        {:else}
            <div class="error-state">
                <div class="icon">❌</div>
                <h1>Verification Failed</h1>
                <p>{error}</p>
                <a href="/login" class="button">Go to Login</a>
            </div>
        {/if}
    </div>
</div>

<style>
    .container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
    }

    .card {
        background: white;
        border-radius: 16px;
        padding: 48px;
        max-width: 480px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .loading,
    .success,
    .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .icon {
        font-size: 72px;
        line-height: 1;
    }

    h1 {
        font-size: 28px;
        color: #333;
        margin: 0;
    }

    p {
        font-size: 16px;
        color: #666;
        margin: 0;
        line-height: 1.6;
    }

    .redirect {
        font-size: 14px;
        color: #999;
        font-style: italic;
    }

    .button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        margin-top: 10px;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
    }

    .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
</style>
