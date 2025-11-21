<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authStore } from "../../stores/auth";
    import { register } from "$lib/api";
    import {
        getTelegramUser,
        isTelegram,
        initTelegramWebApp,
    } from "$lib/telegram";

    let name = "";
    let phone = "";
    let loading = false;
    let error = "";
    let telegramUser: any = null;

    onMount(() => {
        // Initialize Telegram WebApp
        initTelegramWebApp();

        // Check if running in Telegram
        if (!isTelegram()) {
            error = "This app must be opened from Telegram";
            return;
        }

        // Get Telegram user data
        telegramUser = getTelegramUser();
        if (!telegramUser) {
            error = "Could not get Telegram user data";
            return;
        }

        // Pre-fill name from Telegram
        if (telegramUser.first_name) {
            name = telegramUser.first_name;
            if (telegramUser.last_name) {
                name += " " + telegramUser.last_name;
            }
        }
    });

    function formatPhone(value: string): string {
        // Remove all non-digits
        const digits = value.replace(/\D/g, "");

        // Remove leading +38 if present
        const withoutPrefix = digits.startsWith("38")
            ? digits.slice(2)
            : digits;

        // Format as +38 (0XX) XXX-XX-XX
        if (withoutPrefix.length === 0) return "";
        if (withoutPrefix.length <= 3) return `+38 (${withoutPrefix}`;
        if (withoutPrefix.length <= 6)
            return `+38 (${withoutPrefix.slice(0, 3)}) ${withoutPrefix.slice(3)}`;
        if (withoutPrefix.length <= 8)
            return `+38 (${withoutPrefix.slice(0, 3)}) ${withoutPrefix.slice(3, 6)}-${withoutPrefix.slice(6)}`;
        return `+38 (${withoutPrefix.slice(0, 3)}) ${withoutPrefix.slice(3, 6)}-${withoutPrefix.slice(6, 8)}-${withoutPrefix.slice(8, 10)}`;
    }

    function handlePhoneInput(e: Event) {
        const input = e.target as HTMLInputElement;
        const formatted = formatPhone(input.value);
        phone = formatted;
    }

    async function handleSubmit() {
        if (!telegramUser) {
            error = "No Telegram user found";
            return;
        }

        // Validate name
        if (!name.trim()) {
            error = "Please enter your name";
            return;
        }

        if (name.trim().length < 2) {
            error = "Name must be at least 2 characters";
            return;
        }

        // Validate phone
        const phoneDigits = phone.replace(/\D/g, "");
        if (!phoneDigits || phoneDigits.length < 10) {
            error = "Please enter a valid Ukrainian phone number";
            return;
        }

        loading = true;
        error = "";

        try {
            // Clean phone number: keep only digits after +38
            const cleanPhone =
                "+38" + phoneDigits.slice(phoneDigits.startsWith("38") ? 2 : 0);

            const response = await register(
                telegramUser.id,
                name.trim(),
                cleanPhone,
            );

            // Update auth store with user and token
            authStore.setUser(response.user, response.token);

            // Redirect to main page
            await goto("/");
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Registration failed. Please try again.";
            loading = false;
        }
    }
</script>

<div class="registration-container">
    <div class="registration-card">
        <h1>Complete Registration</h1>
        <p class="subtitle">Please provide your details to continue</p>

        {#if error}
            <div class="error-message">
                {error}
            </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-group">
                <label for="name">Full Name</label>
                <input
                    type="text"
                    id="name"
                    bind:value={name}
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                />
            </div>

            <div class="form-group">
                <label for="phone">Phone Number</label>
                <input
                    type="tel"
                    id="phone"
                    value={phone}
                    on:input={handlePhoneInput}
                    placeholder="+38 (0XX) XXX-XX-XX"
                    required
                    disabled={loading}
                />
                <small>Ukrainian phone number</small>
            </div>

            <button type="submit" class="submit-button" disabled={loading}>
                {loading ? "Registering..." : "Complete Registration"}
            </button>
        </form>
    </div>
</div>

<style>
    .registration-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .registration-card {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a202c;
        margin: 0 0 0.5rem 0;
        text-align: center;
    }

    .subtitle {
        color: #718096;
        text-align: center;
        margin: 0 0 2rem 0;
        font-size: 0.875rem;
    }

    .error-message {
        background-color: #fed7d7;
        color: #c53030;
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
        text-align: center;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: all 0.2s;
        box-sizing: border-box;
    }

    input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    input:disabled {
        background-color: #f7fafc;
        cursor: not-allowed;
    }

    small {
        display: block;
        margin-top: 0.25rem;
        color: #a0aec0;
        font-size: 0.75rem;
    }

    .submit-button {
        width: 100%;
        padding: 0.875rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
    }

    .submit-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .submit-button:active:not(:disabled) {
        transform: translateY(0);
    }

    .submit-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>
