// state
const STORAGE_KEY = "lab1_variant6_reports";

const state = {
  items: [],
  editingId: null,
  filters: {
    search: "",
    severity: "",
    status: "",
    sortBy: "createdAt"
  },
  sortDirection: "desc"
};

// dom
const form = document.getElementById("reportForm");
const tableBody = document.getElementById("reportsTableBody");
const tableHead = document.querySelector("#reportsTable thead");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formMessage = document.getElementById("formMessage");

const titleInput = document.getElementById("titleInput");
const severitySelect = document.getElementById("severitySelect");
const statusSelect = document.getElementById("statusSelect");
const descriptionInput = document.getElementById("descriptionInput");
const reporterInput = document.getElementById("reporterInput");

const searchInput = document.getElementById("searchInput");
const severityFilter = document.getElementById("severityFilter");
const statusFilter = document.getElementById("statusFilter");
const toggleSortBtn = document.getElementById("toggleSortBtn");
const counterText = document.getElementById("counterText");
const emptyState = document.getElementById("emptyState");

const severityRank = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4
};

// init
(function init() {
  loadFromStorage();
  attachHandlers();
  render();
})();

// handlers
function attachHandlers() {
  form.addEventListener("submit", onSubmit);
  resetBtn.addEventListener("click", resetForm);
  cancelEditBtn.addEventListener("click", resetForm);

  tableBody.addEventListener("click", onTableClick);

  tableHead.addEventListener("click", (event) => {
    const sortBy = event.target.dataset.sort;
    if (!sortBy) return;

    if (state.filters.sortBy === sortBy) {
      toggleSortDirection();
    } else {
      state.filters.sortBy = sortBy;
      state.sortDirection = "asc";
    }

    render();
  });

  searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    render();
  });

  severityFilter.addEventListener("change", (event) => {
    state.filters.severity = event.target.value;
    render();
  });

  statusFilter.addEventListener("change", (event) => {
    state.filters.status = event.target.value;
    render();
  });

  toggleSortBtn.addEventListener("click", () => {
    toggleSortDirection();
    render();
  });

  [titleInput, severitySelect, statusSelect, descriptionInput, reporterInput].forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field.id));
    field.addEventListener("change", () => clearFieldError(field.id));
  });
}

function onSubmit(event) {
  event.preventDefault();

  const dto = readForm();

  if (!validate(dto)) {
    formMessage.textContent = "Виправте помилки у формі.";
    return;
  }

  submitBtn.disabled = true;

  if (state.editingId) {
    updateReport(state.editingId, dto);
  } else {
    addReport(dto);
  }

  saveToStorage();
  render();
  resetForm();

  submitBtn.disabled = false;
}

function onTableClick(event) {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    startEdit(editId);
    return;
  }

  if (deleteId) {
    deleteReport(deleteId);
  }
}

// crud
function addReport(dto) {
  state.items.push({
    id: createId(),
    ...dto,
    createdAt: new Date().toISOString()
  });
}

function updateReport(id, dto) {
  state.items = state.items.map((item) =>
    item.id === id
      ? {
          ...item,
          ...dto,
          updatedAt: new Date().toISOString()
        }
      : item
  );
}

function deleteReport(id) {
  state.items = state.items.filter((item) => item.id !== id);

  if (state.editingId === id) {
    resetForm();
  }

  saveToStorage();
  render();
}

// form
function readForm() {
  return {
    title: titleInput.value.trim(),
    severity: severitySelect.value,
    status: statusSelect.value || "Open",
    description: descriptionInput.value.trim(),
    reporter: reporterInput.value.trim()
  };
}

function startEdit(id) {
  const item = state.items.find((report) => report.id === id);
  if (!item) return;

  state.editingId = id;

  titleInput.value = item.title;
  severitySelect.value = item.severity;
  statusSelect.value = item.status;
  descriptionInput.value = item.description;
  reporterInput.value = item.reporter;

  formTitle.textContent = "Редагування репорту";
  submitBtn.textContent = "Оновити";
  cancelEditBtn.classList.remove("hidden");
  clearErrors();
  titleInput.focus();
}

function resetForm() {
  state.editingId = null;
  form.reset();
  statusSelect.value = "Open";
  formTitle.textContent = "Новий репорт";
  submitBtn.textContent = "Зберегти";
  cancelEditBtn.classList.add("hidden");
  clearErrors();
  titleInput.focus();
}

// validation
function validate(dto) {
  clearErrors();
  let isValid = true;

  const duplicate = state.items.some((item) =>
    item.id !== state.editingId &&
    item.title.toLowerCase() === dto.title.toLowerCase() &&
    item.reporter.toLowerCase() === dto.reporter.toLowerCase()
  );

  if (!dto.title) {
    showError("titleInput", "Назва є обов’язковою.");
    isValid = false;
  } else if (dto.title.length < 3) {
    showError("titleInput", "Назва має містити мінімум 3 символи.");
    isValid = false;
  }

  if (!dto.severity) {
    showError("severitySelect", "Оберіть критичність.");
    isValid = false;
  }

  if (!dto.status) {
    showError("statusSelect", "Оберіть статус.");
    isValid = false;
  }

  if (!dto.description) {
    showError("descriptionInput", "Опис є обов’язковим.");
    isValid = false;
  } else if (dto.description.length < 10) {
    showError("descriptionInput", "Опис має містити мінімум 10 символів.");
    isValid = false;
  }

  if (!dto.reporter) {
    showError("reporterInput", "Вкажіть автора репорту.");
    isValid = false;
  } else if (dto.reporter.length < 2) {
    showError("reporterInput", "Ім’я автора має містити мінімум 2 символи.");
    isValid = false;
  }

  if (duplicate) {
    showError("titleInput", "Такий репорт від цього автора вже існує.");
    isValid = false;
  }

  return isValid;
}

function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(inputId.replace("Input", "Error").replace("Select", "Error"));

  input.classList.add("invalid");
  if (error) {
    error.textContent = message;
  }
}

function clearFieldError(inputId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(inputId.replace("Input", "Error").replace("Select", "Error"));

  input.classList.remove("invalid");
  if (error) {
    error.textContent = "";
  }

  formMessage.textContent = "";
}

function clearErrors() {
  document.querySelectorAll(".invalid").forEach((field) => field.classList.remove("invalid"));
  document.querySelectorAll(".error-text").forEach((error) => {
    error.textContent = "";
  });
  formMessage.textContent = "";
}

// render
function render() {
  const items = getPreparedItems();

  tableBody.innerHTML = items.map((item, index) => createRowHtml(item, index)).join("");

  counterText.textContent = `Записів: ${items.length} із ${state.items.length}`;
  emptyState.classList.toggle("hidden", state.items.length > 0);
  toggleSortBtn.textContent = `Напрям: ${state.sortDirection === "asc" ? "↑" : "↓"}`;
}

function getPreparedItems() {
  let result = [...state.items];

  if (state.filters.search) {
    result = result.filter((item) =>
      item.title.toLowerCase().includes(state.filters.search) ||
      item.description.toLowerCase().includes(state.filters.search) ||
      item.reporter.toLowerCase().includes(state.filters.search)
    );
  }

  if (state.filters.severity) {
    result = result.filter((item) => item.severity === state.filters.severity);
  }

  if (state.filters.status) {
    result = result.filter((item) => item.status === state.filters.status);
  }

  result.sort((a, b) => compareReports(a, b, state.filters.sortBy));

  return result;
}

function compareReports(a, b, field) {
  let first = a[field];
  let second = b[field];

  if (field === "severity") {
    first = severityRank[a.severity] || 0;
    second = severityRank[b.severity] || 0;
  }

  if (field === "createdAt") {
    first = new Date(a.createdAt).getTime();
    second = new Date(b.createdAt).getTime();
  }

  let result;

  if (typeof first === "number" && typeof second === "number") {
    result = first - second;
  } else {
    result = String(first).localeCompare(String(second), "uk");
  }

  return state.sortDirection === "asc" ? result : -result;
}

function createRowHtml(item, index) {
  return `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.title)}</td>
      <td><span class="badge ${getSeverityClass(item.severity)}">${escapeHtml(item.severity)}</span></td>
      <td>${escapeHtml(item.status)}</td>
      <td class="description-cell">${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.reporter)}</td>
      <td>${formatDate(item.createdAt)}</td>
      <td>
        <button type="button" class="action-btn edit-btn" data-edit="${item.id}">Редагувати</button>
        <button type="button" class="action-btn delete-btn" data-delete="${item.id}">Видалити</button>
      </td>
    </tr>
  `;
}

// storage
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    state.items = [];
    return;
  }

  try {
    state.items = JSON.parse(raw);
  } catch {
    state.items = [];
  }
}

// helpers
function toggleSortDirection() {
  state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSeverityClass(severity) {
  return {
    Low: "badge-low",
    Medium: "badge-medium",
    High: "badge-high",
    Critical: "badge-critical"
  }[severity] || "";
}

function formatDate(value) {
  return new Date(value).toLocaleString("uk-UA", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
