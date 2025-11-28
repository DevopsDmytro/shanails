import { a as attr } from "../../../../chunks/attributes.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let clients = [];
    let searchQuery = "";
    let roleFilter = "";
    let totalClients = 0;
    $$renderer2.push(`<div class="clients-page svelte-v4lzr7"><div class="page-header svelte-v4lzr7"><div class="svelte-v4lzr7"><h2 class="svelte-v4lzr7">Керування Клієнтами</h2> <p class="svelte-v4lzr7">Переглядайте та керуйте клієнтами салону</p></div></div> <div class="filters-section svelte-v4lzr7"><div class="filters-row svelte-v4lzr7"><div class="filter-group svelte-v4lzr7"><label for="searchQuery" class="svelte-v4lzr7">Пошук</label> <input id="searchQuery" type="text"${attr("value", searchQuery)} placeholder="Ім'я або телефон..." class="svelte-v4lzr7"/></div> <div class="filter-group svelte-v4lzr7"><label for="roleFilter" class="svelte-v4lzr7">Роль</label> `);
    $$renderer2.select(
      { id: "roleFilter", value: roleFilter, class: "" },
      ($$renderer3) => {
        $$renderer3.option(
          { value: "", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Всі ролі`);
          },
          "svelte-v4lzr7"
        );
        $$renderer3.option(
          { value: "CLIENT", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Клієнт`);
          },
          "svelte-v4lzr7"
        );
        $$renderer3.option(
          { value: "ADMIN", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Адміністратор`);
          },
          "svelte-v4lzr7"
        );
      },
      "svelte-v4lzr7"
    );
    $$renderer2.push(`</div> <div class="filter-actions svelte-v4lzr7"><button class="btn btn-secondary svelte-v4lzr7">Очистити</button></div></div></div> <div class="stats-row svelte-v4lzr7"><div class="stat-card svelte-v4lzr7"><div class="stat-label svelte-v4lzr7">Всього клієнтів</div> <div class="stat-value svelte-v4lzr7">${escape_html(totalClients)}</div></div> <div class="stat-card svelte-v4lzr7"><div class="stat-label svelte-v4lzr7">Зареєстрованих</div> <div class="stat-value svelte-v4lzr7">${escape_html(clients.filter((c) => c.is_registered).length)}</div></div> <div class="stat-card svelte-v4lzr7"><div class="stat-label svelte-v4lzr7">Активних</div> <div class="stat-value svelte-v4lzr7">${escape_html(clients.filter((c) => (c.cancellations_this_year || 0) < 3).length)}</div></div></div> <div class="table-container svelte-v4lzr7">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading svelte-v4lzr7"><div class="spinner svelte-v4lzr7"></div> <p class="svelte-v4lzr7">Завантаження клієнтів...</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
