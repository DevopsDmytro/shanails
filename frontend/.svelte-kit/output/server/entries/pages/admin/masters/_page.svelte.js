import { a as attr } from "../../../../chunks/attributes.js";
import { Z as bind_props } from "../../../../chunks/index.js";
import { f as fallback } from "../../../../chunks/equality.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
function MasterModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let show = fallback($$props["show"], false);
    let master = fallback($$props["master"], null);
    let loading = fallback($$props["loading"], false);
    let formData = {
      name: "",
      specialization: "",
      description: "",
      photo_url: "",
      is_active: true
    };
    if (master) {
      formData = { ...master };
    } else {
      formData = {
        name: "",
        specialization: "",
        description: "",
        photo_url: "",
        is_active: true
      };
    }
    if (show) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="modal-backdrop svelte-by8ycn"><div class="modal-content svelte-by8ycn"><div class="modal-header svelte-by8ycn"><h2 class="svelte-by8ycn">${escape_html(master ? "Редагувати майстра" : "Додати майстра")}</h2> <button class="close-btn svelte-by8ycn">×</button></div> <div class="modal-body svelte-by8ycn"><div class="form-group svelte-by8ycn"><label for="name" class="svelte-by8ycn">Ім'я</label> <input id="name" type="text"${attr("value", formData.name)} placeholder="Введіть ім'я майстра" class="svelte-by8ycn"/></div> <div class="form-group svelte-by8ycn"><label for="specialization" class="svelte-by8ycn">Спеціалізація</label> <input id="specialization" type="text"${attr("value", formData.specialization)} placeholder="Наприклад: Манікюр, Педикюр" class="svelte-by8ycn"/></div> <div class="form-group svelte-by8ycn"><label for="description" class="svelte-by8ycn">Опис</label> <textarea id="description" placeholder="Короткий опис досвіду та навичок" rows="3" class="svelte-by8ycn">`);
      const $$body = escape_html(formData.description);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></div> <div class="form-group svelte-by8ycn"><label for="photo_url" class="svelte-by8ycn">URL фото</label> <input id="photo_url" type="text"${attr("value", formData.photo_url)} placeholder="https://example.com/photo.jpg" class="svelte-by8ycn"/></div> <div class="form-group checkbox svelte-by8ycn"><label class="svelte-by8ycn"><input type="checkbox"${attr("checked", formData.is_active, true)}/> Активний</label></div></div> <div class="modal-footer svelte-by8ycn"><button class="btn btn-secondary svelte-by8ycn">Скасувати</button> <button class="btn btn-primary svelte-by8ycn"${attr("disabled", loading || !formData.name, true)}>${escape_html(loading ? "Збереження..." : "Зберегти")}</button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { show, master, loading });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let searchQuery = "";
    let activeFilter = "";
    let showModal = false;
    let editingMaster = null;
    let saving = false;
    $$renderer2.push(`<div class="masters-page svelte-7oe8kg"><div class="page-header svelte-7oe8kg"><div class="svelte-7oe8kg"><h2 class="svelte-7oe8kg">Керування Майстрами</h2> <p class="svelte-7oe8kg">Додавайте та редагуйте професійних майстрів салону</p></div> <button class="btn btn-primary svelte-7oe8kg"><span class="btn-icon svelte-7oe8kg">➕</span> Додати майстра</button></div> <div class="filters-section svelte-7oe8kg"><div class="filters-row svelte-7oe8kg"><div class="filter-group svelte-7oe8kg"><label for="searchQuery" class="svelte-7oe8kg">Пошук</label> <input id="searchQuery" type="text"${attr("value", searchQuery)} placeholder="Ім'я або спеціалізація..." class="svelte-7oe8kg"/></div> <div class="filter-group svelte-7oe8kg"><label for="activeFilter" class="svelte-7oe8kg">Статус</label> `);
    $$renderer2.select(
      { id: "activeFilter", value: activeFilter, class: "" },
      ($$renderer3) => {
        $$renderer3.option(
          { value: "", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Всі майстри`);
          },
          "svelte-7oe8kg"
        );
        $$renderer3.option(
          { value: "true", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Активні`);
          },
          "svelte-7oe8kg"
        );
        $$renderer3.option(
          { value: "false", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Неактивні`);
          },
          "svelte-7oe8kg"
        );
      },
      "svelte-7oe8kg"
    );
    $$renderer2.push(`</div> <div class="filter-actions svelte-7oe8kg"><button class="btn btn-secondary svelte-7oe8kg">Очистити</button></div></div></div> <div class="content-container svelte-7oe8kg">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading svelte-7oe8kg"><div class="spinner svelte-7oe8kg"></div> <p class="svelte-7oe8kg">Завантаження майстрів...</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    MasterModal($$renderer2, { show: showModal, master: editingMaster, loading: saving });
    $$renderer2.push(`<!----></div>`);
  });
}
export {
  _page as default
};
