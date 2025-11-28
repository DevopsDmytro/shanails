import { Z as bind_props, V as ensure_array_like, U as attr_class } from "../../../../chunks/index.js";
import { f as fallback } from "../../../../chunks/equality.js";
import { M as MasterSelector } from "../../../../chunks/DateTimePicker.svelte_svelte_type_style_lang.js";
import { a as attr } from "../../../../chunks/attributes.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
const API_BASE_URL = "http://backend:8000/api/v1";
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  ({
    headers: {
      ...options.headers
    },
    ...options
  });
  try {
    const token = localStorage.getItem("auth_token");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const config2 = {
      headers,
      ...options
    };
    const response = await fetch(url, config2);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error occurred");
  }
}
async function getMonthlyAvailability(masterId, month) {
  return apiRequest(
    `/masters/${masterId}/availability-month?month=${month}`
  );
}
function ServiceSelector($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let selectedServices = fallback($$props["selectedServices"], () => [], true);
    let services = [];
    const MAX_SERVICES_COUNT = 3;
    services.reduce(
      (acc, service) => {
        const category = service.category || "Інші";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(service);
        return acc;
      },
      {}
    );
    selectedServices.reduce((sum, service) => sum + (service.duration || service.duration_minutes || 0), 0);
    selectedServices.reduce((sum, service) => sum + service.price, 0);
    selectedServices.length > MAX_SERVICES_COUNT;
    $$renderer2.push(`<div class="service-selector svelte-ee6j9i"><h2 class="svelte-ee6j9i">Оберіть послуги (до 3)</h2> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading svelte-ee6j9i">Завантаження послуг...</div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { selectedServices });
  });
}
function DateTimePicker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let calendarDays, monthString;
    let selectedMaster = fallback($$props["selectedMaster"], null);
    let selectedDate = fallback($$props["selectedDate"], "");
    let selectedTime = fallback($$props["selectedTime"], "");
    let availableSlots = fallback($$props["availableSlots"], () => [], true);
    let loadingAvailability = fallback($$props["loadingAvailability"], false);
    let currentMonth = /* @__PURE__ */ new Date();
    let availableDates = [];
    let loading = false;
    let error = null;
    async function loadMonthlyAvailability() {
      if (!selectedMaster) return;
      loading = true;
      error = null;
      try {
        const monthString2 = formatMonthForAPI(currentMonth);
        const response = await getMonthlyAvailability(selectedMaster.id, monthString2);
        availableDates = response.available_dates;
      } catch (err) {
        error = "Не вдалося завантажити доступні дати";
        console.error("Failed to load monthly availability:", err);
      } finally {
        loading = false;
      }
    }
    function formatMonthForAPI(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}`;
    }
    function generateCalendarDays(date) {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      const days = [];
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const isCurrentMonth = currentDate.getMonth() === month;
        const dayNumber = currentDate.getDate();
        const fullDate = currentDate.toISOString().split("T")[0];
        const isPast = currentDate < today;
        days.push({
          date: dayNumber,
          isCurrentMonth,
          fullDate: isPast ? null : fullDate
        });
      }
      return days;
    }
    function isDateAvailable(dateString) {
      return availableDates.includes(dateString);
    }
    function isDateSelected(dateString) {
      return selectedDate === dateString;
    }
    function formatDate(dateString) {
      const date = /* @__PURE__ */ new Date(dateString + "T00:00:00");
      return date.toLocaleDateString("uk-UA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
    const weekDays = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    calendarDays = generateCalendarDays(currentMonth);
    monthString = currentMonth.toLocaleDateString("uk-UA", { year: "numeric", month: "long" });
    if (selectedMaster && currentMonth) {
      loadMonthlyAvailability();
    }
    $$renderer2.push(`<div class="datetime-picker svelte-1nco14p"><h2 class="svelte-1nco14p">Оберіть дату та час</h2> `);
    if (
      // Reset time when date changes
      // Don't allow past dates
      !selectedMaster
    ) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="no-master svelte-1nco14p"><p>Спочатку оберіть майстра</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (loading) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="loading svelte-1nco14p">Завантаження календаря...</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (error) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="error svelte-1nco14p">${escape_html(error)}</div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<div class="datetime-container svelte-1nco14p"><div class="calendar-section svelte-1nco14p"><div class="month-navigation svelte-1nco14p"><button class="nav-btn svelte-1nco14p"${attr("disabled", loading, true)}>←</button> <h3 class="svelte-1nco14p">${escape_html(monthString)}</h3> <button class="nav-btn svelte-1nco14p"${attr("disabled", loading, true)}>→</button></div> <div class="calendar-grid svelte-1nco14p"><!--[-->`);
          const each_array = ensure_array_like(weekDays);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let day = each_array[$$index];
            $$renderer2.push(`<div class="day-header svelte-1nco14p">${escape_html(day)}</div>`);
          }
          $$renderer2.push(`<!--]--> <!--[-->`);
          const each_array_1 = ensure_array_like(calendarDays);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let day = each_array_1[$$index_1];
            $$renderer2.push(`<button${attr_class("calendar-day svelte-1nco14p", void 0, {
              "current-month": day.isCurrentMonth,
              "other-month": !day.isCurrentMonth,
              "available": day.fullDate && isDateAvailable(day.fullDate),
              "selected": day.fullDate && isDateSelected(day.fullDate),
              "disabled": !day.fullDate || !isDateAvailable(day.fullDate)
            })}${attr("disabled", !day.fullDate || !isDateAvailable(day.fullDate), true)}>${escape_html(day.date)}</button>`);
          }
          $$renderer2.push(`<!--]--></div> <div class="legend svelte-1nco14p"><div class="legend-item svelte-1nco14p"><div class="legend-dot available svelte-1nco14p"></div> <span>Доступні дати</span></div> <div class="legend-item svelte-1nco14p"><div class="legend-dot selected svelte-1nco14p"></div> <span>Обрана дата</span></div></div></div> `);
          if (selectedDate) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="time-section svelte-1nco14p"><div class="selected-date-info svelte-1nco14p"><p class="svelte-1nco14p">📅 ${escape_html(formatDate(selectedDate))}</p></div> `);
            if (loadingAvailability) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="loading-time svelte-1nco14p">Перевірка доступності...</div>`);
            } else {
              $$renderer2.push("<!--[!-->");
              if (availableSlots.length > 0) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="time-slots svelte-1nco14p"><!--[-->`);
                const each_array_2 = ensure_array_like(availableSlots);
                for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
                  let slot = each_array_2[$$index_2];
                  $$renderer2.push(`<button${attr_class("time-slot svelte-1nco14p", void 0, { "selected": selectedTime === slot })}>${escape_html(slot)}</button>`);
                }
                $$renderer2.push(`<!--]--></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
                if (selectedDate) {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`<div class="no-slots svelte-1nco14p"><p class="svelte-1nco14p">На жаль, на цю дату немає вільних слотів.</p> <p class="svelte-1nco14p">Будь ласка, оберіть іншу дату.</p></div>`);
                } else {
                  $$renderer2.push("<!--[!-->");
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, {
      selectedMaster,
      selectedDate,
      selectedTime,
      availableSlots,
      loadingAvailability
    });
  });
}
function AdminBookingModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let show = fallback($$props["show"], false);
    let step = 1;
    let selectedMaster = null;
    let selectedServices = [];
    let selectedDate = "";
    let selectedTime = "";
    let availableSlots = [];
    let loadingAvailability = false;
    let userSearchQuery = "";
    let users = [];
    function resetForm() {
      step = 1;
      selectedMaster = null;
      selectedServices = [];
      selectedDate = "";
      selectedTime = "";
      userSearchQuery = "";
      users = [];
    }
    if (show) {
      resetForm();
    }
    if (
      // DateTimePicker handles loading slots internally via props,
      // but we need to trigger it.
      // Actually DateTimePicker in this project seems to emit dateSelect
      // and expects parent to load slots.
      // Let's check MultiStepBooking logic.
      // We need to implement loadTimeSlots logic here similar to MultiStepBooking
      // Override handleDateSelect to call loadTimeSlots
      // Admin can specify user_id
      show
    ) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="modal-backdrop svelte-p4ta1z"><div class="modal-content svelte-p4ta1z"><div class="modal-header svelte-p4ta1z"><h2 class="svelte-p4ta1z">Новий запис</h2> <button class="close-btn svelte-p4ta1z">×</button></div> <div class="modal-body svelte-p4ta1z">`);
      if (step === 1) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="step-user"><h3 class="svelte-p4ta1z">Крок 1: Оберіть клієнта</h3> <div class="search-box svelte-p4ta1z"><input type="text"${attr("value", userSearchQuery)} placeholder="Пошук за ім'ям або телефоном..." class="svelte-p4ta1z"/></div> <div class="users-list svelte-p4ta1z">`);
        {
          $$renderer2.push("<!--[!-->");
          if (users.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<!--[-->`);
            const each_array = ensure_array_like(users);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let user = each_array[$$index];
              $$renderer2.push(`<button class="user-item svelte-p4ta1z"><div class="user-name svelte-p4ta1z">${escape_html(user.name)}</div> <div class="user-phone svelte-p4ta1z">${escape_html(user.phone || "Без телефону")}</div></button>`);
            }
            $$renderer2.push(`<!--]-->`);
          } else {
            $$renderer2.push("<!--[!-->");
            if (userSearchQuery) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="empty">Клієнтів не знайдено</div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (step === 2) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="step-master"><h3 class="svelte-p4ta1z">Крок 2: Оберіть майстра</h3> `);
          MasterSelector($$renderer2, { selectedMaster });
          $$renderer2.push(`<!----> <button class="btn btn-secondary svelte-p4ta1z">Назад</button></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (step === 3) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="step-services"><h3 class="svelte-p4ta1z">Крок 3: Оберіть послуги</h3> `);
            ServiceSelector($$renderer2, { selectedServices });
            $$renderer2.push(`<!----> <div class="step-actions svelte-p4ta1z"><button class="btn btn-secondary svelte-p4ta1z">Назад</button> <button class="btn btn-primary svelte-p4ta1z"${attr("disabled", selectedServices.length === 0, true)}>Далі</button></div></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
            if (step === 4) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="step-date"><h3 class="svelte-p4ta1z">Крок 4: Дата та час</h3> `);
              DateTimePicker($$renderer2, {
                selectedMaster,
                selectedDate,
                selectedTime,
                availableSlots,
                loadingAvailability
              });
              $$renderer2.push(`<!----> <div class="step-actions svelte-p4ta1z"><button class="btn btn-secondary svelte-p4ta1z">Назад</button> <button class="btn btn-primary svelte-p4ta1z"${attr("disabled", !selectedDate || !selectedTime, true)}>Підтвердити запис</button></div></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { show });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let statusFilter = "";
    let masterFilter = "";
    let searchQuery = "";
    let dateFrom = "";
    let dateTo = "";
    let masters = [];
    const statuses = ["SCHEDULED", "COMPLETED", "CANCELLED"];
    let showModal = false;
    function getStatusLabel(status) {
      switch (status) {
        case "SCHEDULED":
          return "Заплановано";
        case "COMPLETED":
          return "Завершено";
        case "CANCELLED":
          return "Скасовано";
        default:
          return status;
      }
    }
    $$renderer2.push(`<div class="appointments-page svelte-6t1m17"><div class="page-header svelte-6t1m17"><div class="svelte-6t1m17"><h2 class="svelte-6t1m17">Керування Записами</h2> <p class="svelte-6t1m17">Переглядайте та керуйте всіма записами салону</p></div> <button class="btn btn-primary svelte-6t1m17"><span class="btn-icon svelte-6t1m17">➕</span> Новий запис</button></div> <div class="filters-section svelte-6t1m17"><div class="filters-row svelte-6t1m17"><div class="filter-group svelte-6t1m17"><label for="searchQuery" class="svelte-6t1m17">Пошук клієнта</label> <input id="searchQuery" type="text"${attr("value", searchQuery)} placeholder="Ім'я або телефон..." class="svelte-6t1m17"/></div> <div class="filter-group svelte-6t1m17"><label for="statusFilter" class="svelte-6t1m17">Статус</label> `);
    $$renderer2.select(
      { id: "statusFilter", value: statusFilter, class: "" },
      ($$renderer3) => {
        $$renderer3.option(
          { value: "", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Всі статуси`);
          },
          "svelte-6t1m17"
        );
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(statuses);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let status = each_array[$$index];
          $$renderer3.option(
            { value: status, class: "" },
            ($$renderer4) => {
              $$renderer4.push(`${escape_html(getStatusLabel(status))}`);
            },
            "svelte-6t1m17"
          );
        }
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-6t1m17"
    );
    $$renderer2.push(`</div> <div class="filter-group svelte-6t1m17"><label for="masterFilter" class="svelte-6t1m17">Майстер</label> `);
    $$renderer2.select(
      { id: "masterFilter", value: masterFilter, class: "" },
      ($$renderer3) => {
        $$renderer3.option(
          { value: "", class: "" },
          ($$renderer4) => {
            $$renderer4.push(`Всі майстри`);
          },
          "svelte-6t1m17"
        );
        $$renderer3.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(masters);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let master = each_array_1[$$index_1];
          $$renderer3.option(
            { value: master.id, class: "" },
            ($$renderer4) => {
              $$renderer4.push(`${escape_html(master.name)}`);
            },
            "svelte-6t1m17"
          );
        }
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-6t1m17"
    );
    $$renderer2.push(`</div> <div class="filter-group svelte-6t1m17"><label for="dateFrom" class="svelte-6t1m17">Від дати</label> <input id="dateFrom" type="date"${attr("value", dateFrom)} class="svelte-6t1m17"/></div> <div class="filter-group svelte-6t1m17"><label for="dateTo" class="svelte-6t1m17">До дати</label> <input id="dateTo" type="date"${attr("value", dateTo)} class="svelte-6t1m17"/></div> <div class="filter-actions svelte-6t1m17"><button class="btn btn-secondary svelte-6t1m17">Очистити</button></div></div></div> <div class="table-container svelte-6t1m17">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading svelte-6t1m17"><div class="spinner svelte-6t1m17"></div> <p class="svelte-6t1m17">Завантаження записів...</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    AdminBookingModal($$renderer2, { show: showModal });
    $$renderer2.push(`<!----></div>`);
  });
}
export {
  _page as default
};
