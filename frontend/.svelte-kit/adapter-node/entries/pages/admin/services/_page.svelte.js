import { Z as bind_props, V as ensure_array_like } from "../../../../chunks/index.js";
import { f as fallback } from "../../../../chunks/equality.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
import { a as attr } from "../../../../chunks/attributes.js";
function ServiceModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let show = fallback($$props["show"], false);
    let service = fallback($$props["service"], null);
    let loading = fallback($$props["loading"], false);
    let formData = {
      name: "",
      category: "manicure",
      price: 0,
      duration: 60,
      description: "",
      image_url: "",
      is_active: true,
      is_popular: false
    };
    if (service) {
      formData = { ...service };
    } else {
      formData = {
        name: "",
        category: "manicure",
        price: 0,
        duration: 60,
        description: "",
        image_url: "",
        is_active: true,
        is_popular: false
      };
    }
    if (show) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="modal-backdrop svelte-1lyeh34"><div class="modal-content svelte-1lyeh34"><div class="modal-header svelte-1lyeh34"><h2 class="svelte-1lyeh34">${escape_html(service ? "Редагувати послугу" : "Додати послугу")}</h2> <button class="close-btn svelte-1lyeh34">×</button></div> <div class="modal-body svelte-1lyeh34"><div class="form-group svelte-1lyeh34"><label for="name" class="svelte-1lyeh34">Назва</label> <input id="name" type="text"${attr("value", formData.name)} placeholder="Назва послуги" class="svelte-1lyeh34"/></div> <div class="form-row svelte-1lyeh34"><div class="form-group svelte-1lyeh34"><label for="category" class="svelte-1lyeh34">Категорія</label> `);
      $$renderer2.select(
        { id: "category", value: formData.category, class: "" },
        ($$renderer3) => {
          $$renderer3.option({ value: "manicure" }, ($$renderer4) => {
            $$renderer4.push(`Манікюр`);
          });
          $$renderer3.option({ value: "pedicure" }, ($$renderer4) => {
            $$renderer4.push(`Педикюр`);
          });
          $$renderer3.option({ value: "extension" }, ($$renderer4) => {
            $$renderer4.push(`Нарощування`);
          });
          $$renderer3.option({ value: "design" }, ($$renderer4) => {
            $$renderer4.push(`Дизайн`);
          });
        },
        "svelte-1lyeh34"
      );
      $$renderer2.push(`</div> <div class="form-group svelte-1lyeh34"><label for="price" class="svelte-1lyeh34">Ціна (грн)</label> <input id="price" type="number"${attr("value", formData.price)} min="0" class="svelte-1lyeh34"/></div></div> <div class="form-group svelte-1lyeh34"><label for="duration" class="svelte-1lyeh34">Тривалість (хв)</label> <input id="duration" type="number"${attr("value", formData.duration)} min="15" step="15" class="svelte-1lyeh34"/></div> <div class="form-group svelte-1lyeh34"><label for="description" class="svelte-1lyeh34">Опис</label> <textarea id="description" rows="3" class="svelte-1lyeh34">`);
      const $$body = escape_html(formData.description);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></div> <div class="form-group svelte-1lyeh34"><label for="image_url" class="svelte-1lyeh34">URL зображення</label> <input id="image_url" type="text"${attr("value", formData.image_url)} placeholder="https://example.com/image.jpg" class="svelte-1lyeh34"/></div> <div class="form-row checkboxes svelte-1lyeh34"><div class="form-group checkbox svelte-1lyeh34"><label class="svelte-1lyeh34"><input type="checkbox"${attr("checked", formData.is_active, true)} class="svelte-1lyeh34"/> Активна</label></div> <div class="form-group checkbox svelte-1lyeh34"><label class="svelte-1lyeh34"><input type="checkbox"${attr("checked", formData.is_popular, true)} class="svelte-1lyeh34"/> Популярна</label></div></div></div> <div class="modal-footer svelte-1lyeh34"><button class="btn btn-secondary svelte-1lyeh34">Скасувати</button> <button class="btn btn-primary svelte-1lyeh34"${attr("disabled", loading || !formData.name, true)}>${escape_html(loading ? "Збереження..." : "Зберегти")}</button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { show, service, loading });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let searchQuery = "";
    let categoryFilter = "";
    let activeFilter = "";
    let showModal = false;
    let editingService = null;
    let saving = false;
    const categories = [
      { id: "manicure", name: "Манікюр" },
      { id: "pedicure", name: "Педикюр" },
      { id: "extension", name: "Нарощування" },
      { id: "design", name: "Дизайн" }
    ];
    $$renderer2.push(`<div class="services-page svelte-u8udot"><div class="page-header svelte-u8udot"><div class="svelte-u8udot"><h2 class="svelte-u8udot">Керування Послугами</h2> <p class="svelte-u8udot">Налаштуйте перелік та вартість послуг салону</p></div> <button class="btn btn-primary svelte-u8udot"><span class="btn-icon svelte-u8udot">➕</span> Додати послугу</button></div> <div class="filters-section svelte-u8udot"><div class="filters-row svelte-u8udot"><div class="filter-group svelte-u8udot"><label for="searchQuery" class="svelte-u8udot">Пошук</label> <input id="searchQuery" type="text"${attr("value", searchQuery)} placeholder="Назва послуги..." class="svelte-u8udot"/></div> <div class="filter-group svelte-u8udot"><label for="categoryFilter" class="svelte-u8udot">Категорія</label> `);
    $$renderer2.select(
      { id: "categoryFilter", value: categoryFilter, class: "" },
      ($$renderer3) => {
        $$renderer3.option(
          { value: "", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Всі категорії`);
          },
          "svelte-u8udot"
        );
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(categories);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let category = each_array[$$index];
          $$renderer3.option(
            { value: category.id, class: "" },
            ($$renderer4) => {
              $$renderer4.push(`${escape_html(category.name)}`);
            },
            "svelte-u8udot"
          );
        }
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-u8udot"
    );
    $$renderer2.push(`</div> <div class="filter-group svelte-u8udot"><label for="activeFilter" class="svelte-u8udot">Статус</label> `);
    $$renderer2.select(
      { id: "activeFilter", value: activeFilter, class: "" },
      ($$renderer3) => {
        $$renderer3.option(
          { value: "", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Всі послуги`);
          },
          "svelte-u8udot"
        );
        $$renderer3.option(
          { value: "true", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Активні`);
          },
          "svelte-u8udot"
        );
        $$renderer3.option(
          { value: "false", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Неактивні`);
          },
          "svelte-u8udot"
        );
      },
      "svelte-u8udot"
    );
    $$renderer2.push(`</div> <div class="filter-actions svelte-u8udot"><button class="btn btn-secondary svelte-u8udot">Очистити</button></div></div></div> <div class="content-container svelte-u8udot">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading svelte-u8udot"><div class="spinner svelte-u8udot"></div> <p class="svelte-u8udot">Завантаження послуг...</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    ServiceModal($$renderer2, { show: showModal, service: editingService, loading: saving });
    $$renderer2.push(`<!----></div>`);
  });
}
export {
  _page as default
};
