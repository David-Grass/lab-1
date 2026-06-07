import type {
  ApiErrorPayload,
  CommentDto,
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
  demoUserSelect: HTMLSelectElement;
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
    demoUserSelect: document.getElementById("demoUserSelect") as HTMLSelectElement,
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
  select.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Оберіть автора";
  select.append(placeholder);

  for (const user of users) {
    const option = document.createElement("option");
    option.value = String(user.id);
    option.textContent = `${user.name} (${user.email})`;
    select.append(option);
  }
}

export function renderDemoUserSelect(
  select: HTMLSelectElement,
  users: UserDto[],
  selectedId: number,
): void {
  select.replaceChildren();
  for (const user of users) {
    const option = document.createElement("option");
    option.value = String(user.id);
    option.textContent = `${user.name} (id=${user.id})`;
    option.selected = user.id === selectedId;
    select.append(option);
  }
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

  ui.reportsTableBody.replaceChildren();

  reports.forEach((report, index) => {
    const rowNum = (page - 1) * pageSize + index + 1;
    const row = document.createElement("tr");

    const cells = [
      String(rowNum),
      report.title,
      report.severity,
      report.status,
      report.description,
      report.authorName,
    ];

    for (const [idx, value] of cells.entries()) {
      const td = document.createElement("td");
      if (idx === 2) {
        const badge = document.createElement("span");
        badge.className = `badge badge-${report.severity.toLowerCase()}`;
        badge.textContent = value;
        td.append(badge);
      } else if (idx === 4) {
        td.className = "description-cell";
        td.textContent = value;
      } else {
        td.textContent = value;
      }
      row.append(td);
    }

    const actionsCell = document.createElement("td");
    for (const [label, className] of [
      ["Деталі", "view-btn"],
      ["Редаг.", "edit-btn"],
      ["Видал.", "delete-btn"],
    ] as const) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `action-btn ${className}`;
      btn.dataset.id = String(report.id);
      btn.textContent = label;
      actionsCell.append(btn);
    }
    row.append(actionsCell);
    ui.reportsTableBody.append(row);
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  ui.pageInfo.textContent = `Сторінка ${page} з ${totalPages}`;
  ui.prevPageBtn.disabled = page <= 1;
  ui.nextPageBtn.disabled = page >= totalPages;
  ui.sortDirBtn.textContent =
    ui.sortDirBtn.dataset.dir === "asc" ? "Напрям: ↑" : "Напрям: ↓";
}

function appendLabelParagraph(
  parent: HTMLElement,
  label: string,
  value: string,
): void {
  const p = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  p.append(strong, document.createTextNode(value));
  parent.append(p);
}

export function renderDetail(
  panel: HTMLElement,
  report: ReportWithAuthorDto,
  comments: CommentDto[],
): void {
  panel.classList.remove("hidden");
  panel.replaceChildren();

  const title = document.createElement("h3");
  title.textContent = `Деталі репорту #${report.id}`;
  panel.append(title);

  appendLabelParagraph(panel, "Назва", report.title);
  appendLabelParagraph(panel, "Критичність", report.severity);
  appendLabelParagraph(panel, "Статус", report.status);
  appendLabelParagraph(
    panel,
    "Автор",
    `${report.authorName} (${report.authorEmail})`,
  );
  appendLabelParagraph(panel, "Опис", report.description);

  const commentsTitle = document.createElement("h4");
  commentsTitle.textContent = "Коментарі";
  panel.append(commentsTitle);

  if (comments.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Коментарів немає.";
    panel.append(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "comments-list";

  for (const comment of comments) {
    const item = document.createElement("li");
    item.className = "comment-item";

    const meta = document.createElement("p");
    meta.className = "comment-meta";
    meta.textContent = `${comment.authorName} · #${comment.id}`;

    const body = document.createElement("p");
    body.className = "comment-body";
    body.textContent = comment.body;

    item.append(meta, body);
    list.append(item);
  }

  panel.append(list);
}

export function hideDetail(panel: HTMLElement): void {
  panel.classList.add("hidden");
  panel.replaceChildren();
}

export function formatApiError(error: ApiErrorPayload): string {
  return toUserMessage(error);
}
