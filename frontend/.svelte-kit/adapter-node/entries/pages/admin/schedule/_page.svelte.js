import { V as ensure_array_like } from "../../../../chunks/index.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let masters = [];
    let selectedMaster = "";
    (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    $$renderer2.push(`<div class="schedule-page svelte-13rp68e"><div class="page-header svelte-13rp68e"><div class="svelte-13rp68e"><h2 class="svelte-13rp68e">Керування Розкладом</h2> <p class="svelte-13rp68e">Налаштуйте робочі години та перерви майстрів</p></div> <button class="btn btn-primary svelte-13rp68e"><span class="btn-icon svelte-13rp68e">➕</span> Додати розклад</button></div> <div class="schedule-controls svelte-13rp68e"><div class="control-group svelte-13rp68e"><label for="masterSelect" class="svelte-13rp68e">Майстер</label> `);
    $$renderer2.select(
      { id: "masterSelect", value: selectedMaster, class: "" },
      ($$renderer3) => {
        $$renderer3.option(
          { value: "", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Оберіть майстра...`);
          },
          "svelte-13rp68e"
        );
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(masters);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let master = each_array[$$index];
          $$renderer3.option(
            { value: master.id, class: "" },
            ($$renderer4) => {
              $$renderer4.push(`${escape_html(master.name)}`);
            },
            "svelte-13rp68e"
          );
        }
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-13rp68e"
    );
    $$renderer2.push(`</div></div> <div class="content-container svelte-13rp68e">`);
    {
      $$renderer2.push("<!--[!-->");
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="empty-state svelte-13rp68e"><p class="svelte-13rp68e">Оберіть майстра щоб побачити розклад</p></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
