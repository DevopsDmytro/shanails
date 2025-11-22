import "clsx";
import { W as bind_props, X as attr_style, Y as ensure_array_like, Z as attr_class, _ as stringify } from "../../../chunks/index.js";
import { f as fallback } from "../../../chunks/equality.js";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
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
function MultiStepBooking($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let canProceedFromMaster;
    let bookingError = fallback($$props["bookingError"], null);
    let currentStep = 1;
    const totalSteps = 4;
    let selectedMaster = null;
    let selectedServices = [];
    canProceedFromMaster = selectedMaster !== null;
    selectedServices.reduce((sum, service) => sum + (service.duration || service.duration_minutes || 0), 0);
    selectedServices.reduce((sum, service) => sum + service.price, 0);
    $$renderer2.push(`<div class="multi-step-booking svelte-y1l0we"><div class="progress-indicator svelte-y1l0we"><div class="progress-bar svelte-y1l0we"><div class="progress-fill svelte-y1l0we"${attr_style(`width: ${stringify((currentStep - 1) / (totalSteps - 1) * 100)}%`)}></div></div> <div class="step-dots svelte-y1l0we"><!--[-->`);
    const each_array = ensure_array_like(Array(totalSteps));
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      each_array[i];
      $$renderer2.push(`<button${attr_class("step-dot svelte-y1l0we", void 0, {
        "active": currentStep === i + 1,
        "completed": i + 1 < currentStep
      })}${attr("disabled", i + 1 > currentStep, true)}>${escape_html(i + 1)}</button>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="step-content svelte-y1l0we">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="step-master svelte-y1l0we">`);
      MasterSelector($$renderer2, { selectedMaster });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="navigation svelte-y1l0we">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button class="btn primary svelte-y1l0we"${attr("disabled", !canProceedFromMaster || currentStep === 2 || currentStep === 3, true)}>Далі →</button>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, { bookingError });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let bookingError = null;
    $$renderer2.push(`<div class="container"><div class="card">`);
    {
      $$renderer2.push("<!--[!-->");
      MultiStepBooking($$renderer2, { bookingError });
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
