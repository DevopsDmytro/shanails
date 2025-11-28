import { V as ensure_array_like } from "../../../../chunks/index.js";
import { a as attr } from "../../../../chunks/attributes.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let dateFrom = "";
    let dateTo = "";
    let stats = {
      total_revenue: 0,
      total_appointments: 0,
      completed_appointments: 0,
      cancelled_appointments: 0
    };
    let popularServices = [];
    let masterPerformance = [];
    $$renderer2.push(`<div class="reports-page svelte-floxyk"><div class="page-header svelte-floxyk"><div class="svelte-floxyk"><h2 class="svelte-floxyk">Звіти та Аналітика</h2> <p class="svelte-floxyk">Аналізуйте продуктивність та дохід салону</p></div></div> <div class="date-controls svelte-floxyk"><div class="control-group svelte-floxyk"><label for="dateFrom" class="svelte-floxyk">Від дати</label> <input id="dateFrom" type="date"${attr("value", dateFrom)} class="svelte-floxyk"/></div> <div class="control-group svelte-floxyk"><label for="dateTo" class="svelte-floxyk">До дати</label> <input id="dateTo" type="date"${attr("value", dateTo)} class="svelte-floxyk"/></div> <button class="btn btn-primary svelte-floxyk">Сформувати звіт</button></div> `);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="stats-grid svelte-floxyk"><div class="stat-card revenue svelte-floxyk"><div class="stat-icon svelte-floxyk">💰</div> <div class="stat-content svelte-floxyk"><div class="stat-value svelte-floxyk">${escape_html(stats.total_revenue.toLocaleString())} грн</div> <div class="stat-label svelte-floxyk">Загальний дохід</div></div></div> <div class="stat-card svelte-floxyk"><div class="stat-icon svelte-floxyk">📅</div> <div class="stat-content svelte-floxyk"><div class="stat-value svelte-floxyk">${escape_html(stats.total_appointments)}</div> <div class="stat-label svelte-floxyk">Всього записів</div></div></div> <div class="stat-card svelte-floxyk"><div class="stat-icon svelte-floxyk">✓</div> <div class="stat-content svelte-floxyk"><div class="stat-value svelte-floxyk">${escape_html(stats.completed_appointments)}</div> <div class="stat-label svelte-floxyk">Завершених</div></div></div> <div class="stat-card svelte-floxyk"><div class="stat-icon svelte-floxyk">✗</div> <div class="stat-content svelte-floxyk"><div class="stat-value svelte-floxyk">${escape_html(stats.cancelled_appointments)}</div> <div class="stat-label svelte-floxyk">Скасованих</div></div></div></div> <div class="reports-grid svelte-floxyk"><div class="report-card svelte-floxyk"><h3 class="svelte-floxyk">Популярні Послуги</h3> `);
      if (popularServices.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="no-data svelte-floxyk"><p class="svelte-floxyk">📊 Немає даних за обраний період</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="report-content svelte-floxyk"><!--[-->`);
        const each_array = ensure_array_like(popularServices);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let service = each_array[$$index];
          $$renderer2.push(`<div class="report-item svelte-floxyk"><div class="item-info svelte-floxyk"><div class="item-name svelte-floxyk">${escape_html(service.name)}</div> <div class="item-meta svelte-floxyk">${escape_html(service.count)} записів</div></div> <div class="item-value svelte-floxyk">${escape_html(service.revenue.toLocaleString())} грн</div></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="report-card svelte-floxyk"><h3 class="svelte-floxyk">Продуктивність Майстрів</h3> `);
      if (masterPerformance.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="no-data svelte-floxyk"><p class="svelte-floxyk">📊 Немає даних за обраний період</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="report-content svelte-floxyk"><!--[-->`);
        const each_array_1 = ensure_array_like(masterPerformance);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let master = each_array_1[$$index_1];
          $$renderer2.push(`<div class="report-item svelte-floxyk"><div class="item-info svelte-floxyk"><div class="item-name svelte-floxyk">${escape_html(master.name)}</div> <div class="item-meta svelte-floxyk">${escape_html(master.appointments)} записів</div></div> <div class="item-value svelte-floxyk">${escape_html(master.revenue.toLocaleString())} грн</div></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></div> <div class="placeholder svelte-floxyk"><div class="placeholder-icon svelte-floxyk">📈</div> <h3 class="svelte-floxyk">Розширена аналітика в розробці</h3> <p class="svelte-floxyk">Скоро будуть доступні графіки, порівняння періодів та експорт
                звітів</p></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
