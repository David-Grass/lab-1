import type {
  ApiErrorPayload,
  FieldErrors,
  ReportFormValues,
  ReportListQuery,
  ReportWithAuthorDto,
  UserDto,
} from "./dtos";
import { toUserMessage } from "./errorMessages";

export type UiElements = {
  notice: HTMLElement;
  listStatus: HTMLElement;
  listContainer: HTMLElement;
  detailPanel: HTMLElement;
  cancelLoadBtn: HTMLButtonElement;
  reportForm: HTMLFormElement;
  formTitle: HTMLElement;
  submitBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  cancelEditBtn: HTMLButtonElement;
  formMessage: HTMLElement;
  titleInput: HTMLInputElement;
  severitySelect: HTMLSelectElement;
  statusSelect: HTMLSelectElement;
  descriptionInput: HTMLTextAreaElement;
  userSelect: HTMLSelectElement;
  searchInput: HTMLInputElement;
  severityFilter: HTMLSelectElement;
  statusFilter: HTMLSelectElement;
  sortBySelect: HTMLSelectElement;
  sortDirBtn: HTMLButtonElement;
  prevPageBtn: HTMLButtonElement;
  nextPageBtn: HTMLButtonElement;
  pageInfo: HTMLElement;
  reportsTableBody: HTMLTableSectionElement;
  emptyState: HTMLElement;
  counterText: HTMLElement;
  fieldErrors: Record<keyof ReportFormValues, HTMLElement>;
};

export function getUiElements(): UiElements {
  return {
    notice: document.getElementById("notice")!,
    listStatus: document.getElementById("listStatus")!,
    listContainer: document.getElementById("listContainer")!,
    detailPanel: document.getElementById("detailPanel")!,
    cancelLoadBtn: document.getElementById("cancelLoadBtn") as HTMLButtonElement,
    reportForm: document.getElementById("reportForm") as HTMLFormElement,
    formTitle: document.getElementById("formTitle")!,
    submitBtn: document.getElementById("submitBtn") as HTMLButtonElement,
    resetBtn: document.getElementById("resetBtn") as HTMLButtonElement,
    cancelEditBtn: document.getElementById("cancelEditBtn") as HTMLButtonElement,
    formMessage: document.getElementById("formMessage")!,
    titleInput: document.getElementById("titleInput") as HTMLInputElement,
    severitySelect: document.getElementById("severitySelect") as HTMLSelectElement,
    statusSelect: document.getElementById("statusSelect") as HTMLSelectElement,
    descriptionInput: document.getElementById("descriptionInput") as HTMLTextAreaElement,
    userSelect: document.getElementById("userSelect") as HTMLSelectElement,
    searchInput: document.getElementById("searchInput") as HTMLInputElement,
    severityFilter: document.getElementById("severityFilter") as HTMLSelectElement,
    statusFilter: document.getElementById("statusFilter") as HTMLSelectElement,
    sortBySelect: document.getElementById("sortBySelect") as HTMLSelectElement,
    sortDirBtn: document.getElementById("sortDirBtn") as HTMLButtonElement,
    prevPageBtn: document.getElementById("prevPageBtn") as HTMLButtonElement,
    nextPageBtn: document.getElementById("nextPageBtn") as HTMLButtonElement,
    pageInfo: document.getElementById("pageInfo")!,
    reportsTableBody: document.getElementById("reportsTableBody") as HTMLTableSectionElement,
    emptyState: document.getElementById("emptyState")!,
    counterText: document.getElementById("counterText")!,
    fieldErrors: {
      userId: document.getElementById("userError")!,
      title: document.getElementById("titleError")!,
      severity: document.getElementById("severityError")!,
      status: document.getElementById("statusError")!,
      description: document.getElementById("descriptionError")!,
    },
  };
}

export function showNotice(
  el: HTMLElement,
  message: string,
  type: "info" | "error" | "success" = "info",
): void {
  el.className = `notice notice--${type}`;
  el.textContent = message;
}

export function clearNotice(el: HTMLElement): void {
  el.className = "notice hidden";
  el.textContent = "";
}

export function setListLoading(
  statusEl: HTMLElement,
  cancelBtn: HTMLButtonElement,
  loading: boolean,
): void {
  if (loading) {
    statusEl.className = "list-status list-status--loading";
    statusEl.textContent = "Завантаження...";
    cancelBtn.classList.remove("hidden");
  } else {
    statusEl.className = "list-status hidden";
    statusEl.textContent = "";
    cancelBtn.classList.add("hidden");
  }
}

export function setFormBusy(
  submitBtn: HTMLButtonElement,
  resetBtn: HTMLButtonElement,
  busy: boolean,
): void {
  submitBtn.disabled = busy;
  resetBtn.disabled = busy;
}

export function renderUsersSelect(select: HTMLSelectElement, users: UserDto[]): void {
  select.innerHTML =
    '<option value="">Оберіть автора</option>' +
    users
      .map(
        (user) =>
          `<option value="${user.id}">${escapeHtml(user.name)} (${escapeHtml(user.email)})</option>`,
      )
      .join("");
}

export function renderFieldErrors(
  fieldErrors: Record<keyof ReportFormValues, HTMLElement>,
  errors: FieldErrors,
): void {
  const inputByField: Record<keyof ReportFormValues, HTMLElement | null> = {
    userId: document.getElementById("userSelect"),
    title: document.getElementById("titleInput"),
    severity: document.getElementById("severitySelect"),
    status: document.getElementById("statusSelect"),
    description: document.getElementById("descriptionInput"),
  };

  for (const key of Object.keys(fieldErrors) as Array<keyof ReportFormValues>) {
    const message = errors[key] ?? "";
    fieldErrors[key].textContent = message;
    inputByField[key]?.classList.toggle("invalid", Boolean(message));
  }
}

export function clearFieldErrors(
  fieldErrors: Record<keyof ReportFormValues, HTMLElement>,
): void {
  renderFieldErrors(fieldErrors, {});
}

export function readFormValues(ui: UiElements): ReportFormValues {
  return {
    userId: ui.userSelect.value,
    title: ui.titleInput.value,
    severity: ui.severitySelect.value as ReportFormValues["severity"],
    status: ui.statusSelect.value as ReportFormValues["status"],
    description: ui.descriptionInput.value,
  };
}

export function fillForm(ui: UiElements, report: ReportWithAuthorDto): void {
  ui.userSelect.value = String(report.userId);
  ui.titleInput.value = report.title;
  ui.severitySelect.value = report.severity;
  ui.statusSelect.value = report.status;
  ui.descriptionInput.value = report.description;
}

export function resetFormUi(ui: UiElements): void {
  ui.reportForm.reset();
  ui.statusSelect.value = "Open";
  ui.formTitle.textContent = "Новий репорт";
  ui.submitBtn.textContent = "Зберегти";
  ui.cancelEditBtn.classList.add("hidden");
  ui.formMessage.textContent = "";
  clearFieldErrors(ui.fieldErrors);
}

export function setEditMode(ui: UiElements): void {
  ui.formTitle.textContent = "Редагування репорту";
  ui.submitBtn.textContent = "Оновити";
  ui.cancelEditBtn.classList.remove("hidden");
}

export function readListQuery(ui: UiElements, page: number): ReportListQuery {
  return {
    search: ui.searchInput.value.trim() || undefined,
    severity: (ui.severityFilter.value || undefined) as ReportListQuery["severity"],
    status: (ui.statusFilter.value || undefined) as ReportListQuery["status"],
    sortBy: ui.sortBySelect.value || "id",
    sortDir: ui.sortDirBtn.dataset.dir === "asc" ? "asc" : "desc",
    page,
    pageSize: 10,
  };
}

export function renderReportsTable(
  ui: UiElements,
  reports: ReportWithAuthorDto[],
  total: number,
  page: number,
  pageSize: number,
): void {
  ui.counterText.textContent = `Записів: ${total}`;
  ui.emptyState.classList.toggle("hidden", reports.length > 0);
  ui.listContainer.classList.toggle("hidden", reports.length === 0);

  ui.reportsTableBody.innerHTML = reports
    .map((report, index) => {
      const rowNum = (page - 1) * pageSize + index + 1;
      return `
        <tr>
          <td>${rowNum}</td>
          <td>${escapeHtml(report.title)}</td>
          <td><span class="badge badge-${report.severity.toLowerCase()}">${report.severity}</span></td>
          <td>${escapeHtml(report.status)}</td>
          <td class="description-cell">${escapeHtml(report.description)}</td>
          <td>${escapeHtml(report.authorName)}</td>
          <td>
            <button type="button" class="action-btn view-btn" data-id="${report.id}">Деталі</button>
            <button type="button" class="action-btn edit-btn" data-id="${report.id}">Редаг.</button>
            <button type="button" class="action-btn delete-btn" data-id="${report.id}">Видал.</button>
          </td>
        </tr>`;
    })
    .join("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  ui.pageInfo.textContent = `Сторінка ${page} з ${totalPages}`;
  ui.prevPageBtn.disabled = page <= 1;
  ui.nextPageBtn.disabled = page >= totalPages;
  ui.sortDirBtn.textContent =
    ui.sortDirBtn.dataset.dir === "asc" ? "Напрям: ↑" : "Напрям: ↓";
}

export function renderDetail(panel: HTMLElement, report: ReportWithAuthorDto): void {
  panel.classList.remove("hidden");
  panel.innerHTML = `
    <h3>Деталі репорту #${report.id}</h3>
    <p><strong>Назва:</strong> ${escapeHtml(report.title)}</p>
    <p><strong>Критичність:</strong> ${escapeHtml(report.severity)}</p>
    <p><strong>Статус:</strong> ${escapeHtml(report.status)}</p>
    <p><strong>Автор:</strong> ${escapeHtml(report.authorName)} (${escapeHtml(report.authorEmail)})</p>
    <p><strong>Опис:</strong> ${escapeHtml(report.description)}</p>
  `;
}

export function hideDetail(panel: HTMLElement): void {
  panel.classList.add("hidden");
  panel.innerHTML = "";
}

export function formatApiError(error: ApiErrorPayload): string {
  return toUserMessage(error);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
