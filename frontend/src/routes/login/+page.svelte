<script lang="ts">
    import { config } from "$lib/config";
</script>

<div class="login-container">
    <div class="card">
        <h1>Welcome Back</h1>
        <p>Please log in to continue to Shanails Nail Studio.</p>

        <a
            href="https://t.me/{config.botUsername}?start=login"
            class="telegram-login-btn"
        >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path
                    d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.638z"
                />
            </svg>
            Log in with Telegram
        </a>
    </div>
</div>

<style>
    .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
        padding: 20px;
    }

    .card {
        background: white;
        padding: 40px;
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        text-align: center;
        max-width: 400px;
        width: 100%;
    }

    h1 {
        margin-top: 0;
        color: #333;
        font-size: 24px;
    }

    p {
        color: #666;
        margin-bottom: 30px;
    }

    .telegram-login-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background-color: #2481cc;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        transition: background-color 0.2s;
        width: 100%;
        box-sizing: border-box;
    }

    .telegram-login-btn:hover {
        background-color: #1a65a3;
    }
</style>
