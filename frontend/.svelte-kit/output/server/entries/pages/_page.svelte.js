import { X as bind_props } from "../../chunks/index2.js";
function _page($$renderer, $$props) {
  let data = $$props["data"];
  $$renderer.push(`<div class="container"><div class="card"><h1>Ласкаво просимо до Салону Красоти</h1> <p>Запишіться на послуги наших майстрів</p> <a href="/booking" class="btn">Записатися зараз</a></div></div>`);
  bind_props($$props, { data });
}
export {
  _page as default
};
