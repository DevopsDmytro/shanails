import { Z as bind_props } from "./index.js";
import { f as fallback } from "./equality.js";
function MasterSelector($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let selectedMaster = fallback($$props["selectedMaster"], null);
    $$renderer2.push(`<div class="master-selector svelte-1gnybup"><h2 class="svelte-1gnybup">Оберіть майстра</h2> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading svelte-1gnybup">Завантаження майстрів...</div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { selectedMaster });
  });
}
export {
  MasterSelector as M
};
