<script lang="ts">
    let selectedMaster = "";
    let selectedDate = new Date().toISOString().split("T")[0];
</script>

<div class="schedule-page">
    <div class="page-header">
        <div>
            <h2>Керування Розкладом</h2>
            <p>Налаштуйте робочі години та перерви майстрів</p>
        </div>
        <button class="btn btn-primary">
            <span class="btn-icon">➕</span>
            Додати розклад
        </button>
    </div>

    <div class="schedule-controls">
        <div class="control-group">
            <label for="masterSelect">Майстер</label>
            <select id="masterSelect" bind:value={selectedMaster}>
                <option value="">Оберіть майстра...</option>
            </select>
        </div>
        <div class="control-group">
            <label for="dateSelect">Дата</label>
            <input id="dateSelect" type="date" bind:value={selectedDate} />
        </div>
    </div>

    <div class="placeholder">
        <div class="placeholder-icon">🕐</div>
        <h3>Функціонал розкладу в розробці</h3>
        <p>
            Тут буде календар з налаштуваннями робочих годин та перерв для
            кожного майстра
        </p>
    </div>
</div>

<style>
    .schedule-page {
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
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white;
    }

    .btn-icon {
        font-size: 1.125rem;
    }

    .schedule-controls {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .control-group label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }

    .control-group select,
    .control-group input {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.9375rem;
    }

    .placeholder {
        background: white;
        border-radius: 12px;
        padding: 4rem 2rem;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .placeholder-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .placeholder h3 {
        color: #111827;
        margin: 0 0 0.5rem;
    }

    .placeholder p {
        color: #6b7280;
        margin: 0;
    }
</style>
