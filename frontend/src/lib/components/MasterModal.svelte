<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Master } from "$lib/api";

    export let show = false;
    export let master: Partial<Master> | null = null;
    export let loading = false;

    const dispatch = createEventDispatcher();

    let formData: Partial<Master> = {
        name: "",

        description: "",
        photo_url: "",
        is_active: true,
    };

    $: if (master) {
        formData = { ...master };
    } else {
        formData = {
            name: "",

            description: "",
            photo_url: "",
            is_active: true,
        };
    }

    function handleClose() {
        dispatch("close");
    }

    function handleSubmit() {
        dispatch("save", formData);
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click={handleClose}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2>{master ? "Редагувати майстра" : "Додати майстра"}</h2>
                <button class="close-btn" on:click={handleClose}>&times;</button
                >
            </div>

            <div class="modal-body">
                <div class="form-group">
                    <label for="name">Ім'я</label>
                    <input
                        id="name"
                        type="text"
                        bind:value={formData.name}
                        placeholder="Введіть ім'я майстра"
                    />
                </div>

                <div class="form-group">
                    <label for="description">Опис</label>
                    <textarea
                        id="description"
                        bind:value={formData.description}
                        placeholder="Короткий опис досвіду та навичок"
                        rows="3"
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="photo_url">URL фото</label>
                    <input
                        id="photo_url"
                        type="text"
                        bind:value={formData.photo_url}
                        placeholder="https://example.com/photo.jpg"
                    />
                </div>

                <div class="form-group checkbox">
                    <label>
                        <input
                            type="checkbox"
                            bind:checked={formData.is_active}
                        />
                        Активний
                    </label>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" on:click={handleClose}
                    >Скасувати</button
                >
                <button
                    class="btn btn-primary"
                    on:click={handleSubmit}
                    disabled={loading || !formData.name}
                >
                    {loading ? "Збереження..." : "Зберегти"}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #111827;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6b7280;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
    }

    .form-group input[type="text"],
    .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.9375rem;
        transition: border-color 0.2s;
    }

    .form-group input[type="text"]:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }

    .form-group.checkbox label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-secondary {
        background: #e5e7eb;
        color: #374151;
    }

    .btn-secondary:hover {
        background: #d1d5db;
    }

    .btn-primary {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
