<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let message: string;

    const dispatch = createEventDispatcher();

    // Replace with actual salon phone number
    const SALON_PHONE = "+380501234567";
    const SALON_PHONE_DISPLAY = "+380 50 123 45 67";

    function handleClose() {
        dispatch("close");
    }
</script>

<div class="modal-overlay" on:click={handleClose}>
    <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
            <div class="warning-icon">⚠️</div>
            <button class="close-btn" on:click={handleClose}>✕</button>
        </div>

        <div class="modal-body">
            <h2>Досягнуто ліміт</h2>
            <p class="warning-message">{message}</p>
            <p class="help-text">
                Зателефонуйте адміністратору салону для допомоги:
            </p>

            <a href="tel:{SALON_PHONE}" class="phone-button">
                <span class="phone-icon">📞</span>
                <span class="phone-number">{SALON_PHONE_DISPLAY}</span>
            </a>

            <p class="additional-info">
                Наш адміністратор допоможе вам зі змінами запису або
                скасуванням.
            </p>
        </div>

        <div class="modal-footer">
            <button class="btn btn-primary" on:click={handleClose}>
                Зрозуміло
            </button>
        </div>
    </div>
</div>

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1100;
        padding: 1rem;
    }

    .modal-content {
        background: white;
        border-radius: 16px;
        max-width: 450px;
        width: 100%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 1.5rem 0;
    }

    .warning-icon {
        font-size: 3rem;
        margin: 0 auto;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #9ca3af;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
        transition: color 0.2s;
        position: absolute;
        right: 1.5rem;
        top: 1.5rem;
    }

    .close-btn:hover {
        color: #4b5563;
    }

    .modal-body {
        padding: 1.5rem;
        text-align: center;
    }

    h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #dc2626;
        margin: 0 0 1rem;
    }

    .warning-message {
        font-size: 1.125rem;
        color: #374151;
        margin-bottom: 1.5rem;
        line-height: 1.6;
    }

    .help-text {
        color: #6b7280;
        margin-bottom: 1rem;
    }

    .phone-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        font-size: 1.125rem;
        transition: all 0.2s;
        margin-bottom: 1rem;
    }

    .phone-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
    }

    .phone-icon {
        font-size: 1.5rem;
    }

    .phone-number {
        letter-spacing: 0.5px;
    }

    .additional-info {
        font-size: 0.875rem;
        color: #9ca3af;
        font-style: italic;
        margin: 0;
    }

    .modal-footer {
        padding: 0 1.5rem 1.5rem;
    }

    .btn {
        width: 100%;
        padding: 0.875rem 1.5rem;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1rem;
    }

    .btn-primary {
        background: #e5e7eb;
        color: #374151;
    }

    .btn-primary:hover {
        background: #d1d5db;
    }
</style>
