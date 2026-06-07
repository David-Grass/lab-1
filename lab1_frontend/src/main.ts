import {
  createReport,
  deleteReport,
  getCommentsByReportId,
  getReportById,
  getReports,
  getUsers,
  getDemoUserId,
  setDemoUserId,
  updateReport,
  withTimeout,
} from "./apiClient";
import type { ApiErrorPayload, ReportWithAuthorDto } from "./dtos";
import {
  clearNotice,
  fillForm,
  formatApiError,
  getUiElements,
  hideDetail,
  readFormValues,
  readListQuery,
  renderDetail,
  renderFieldErrors,
  renderDemoUserSelect,
  renderReportsTable,
  renderUsersSelect,
  resetFormUi,
  setEditMode,
  setFormBusy,
  setListLoading,
  showNotice,
} from "./ui";
import {
  formValuesToDto,
  hasFieldErrors,
  validateReportForm,
} from "./validation";

const ui = getUiElements();

const state = {
  users: [] as Awaited<ReturnType<typeof getUsers>>,
  reports: [] as ReportWithAuthorDto[],
  total: 0,
  page: 1,
  editingId: null as number | null,
  listAbort: null as (() => void) | null,
  formAbort: null as (() => void) | null,
};

function isApiError(error: unknown): error is ApiErrorPayload {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error
  );
}

async function loadUsers(): Promise<void> {
  state.users = await getUsers();
  renderUsersSelect(ui.userSelect, state.users);
}

async function loadReports(): Promise<void> {
  state.listAbort?.();
  setListLoading(ui.listStatus, ui.cancelLoadBtn, true);
  clearNotice(ui.notice);

  const { promise, abort } = withTimeout(async (signal) => {
    const query = readListQuery(ui, state.page);
    const result = await getReports(query, signal);
    state.reports = result.data;
    state.total = result.meta.total;
    renderReportsTable(
      ui,
      state.reports,
      state.total,
      state.page,
      query.pageSize ?? 10,
    );
  });

  state.listAbort = abort;

  try {
    await promise;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      showNotice(ui.notice, "Завантаження скасовано", "info");
      return;
    }
    if (isApiError(error)) {
      showNotice(ui.notice, formatApiError(error), "error");
    } else {
      showNotice(ui.notice, "Невідома помилка завантаження", "error");
    }
    state.reports = [];
    state.total = 0;
    renderReportsTable(ui, [], 0, 1, 10);
  } finally {
    setListLoading(ui.listStatus, ui.cancelLoadBtn, false);
    state.listAbort = null;
  }
}

async function showReportDetails(id: number): Promise<void> {
  try {
    const [report, comments] = await Promise.all([
      getReportById(id),
      getCommentsByReportId(id),
    ]);
    renderDetail(ui.detailPanel, report, comments);
  } catch (error) {
    if (isApiError(error)) {
      showNotice(ui.notice, formatApiError(error), "error");
    }
  }
}

async function startEdit(id: number): Promise<void> {
  try {
    const report = await getReportById(id);
    state.editingId = report.id;
    fillForm(ui, report);
    setEditMode(ui);
    hideDetail(ui.detailPanel);
    clearNotice(ui.notice);
  } catch (error) {
    if (isApiError(error)) {
      showNotice(ui.notice, formatApiError(error), "error");
    }
  }
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  ui.formMessage.textContent = "";

  const values = readFormValues(ui);
  const errors = validateReportForm(values);
  renderFieldErrors(ui.fieldErrors, errors);
  if (hasFieldErrors(errors)) {
    ui.formMessage.textContent = "Виправте помилки у формі";
    return;
  }

  state.formAbort?.();
  setFormBusy(ui.submitBtn, ui.resetBtn, true);

  const dto = formValuesToDto(values);
  const { promise, abort } = withTimeout(async (signal) => {
    if (state.editingId === null) {
      await createReport(dto, signal);
    } else {
      await updateReport(state.editingId, dto, signal);
    }
  });

  state.formAbort = abort;

  try {
    await promise;
    resetFormUi(ui);
    state.editingId = null;
    showNotice(ui.notice, "Репорт збережено", "success");
    await loadReports();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      ui.formMessage.textContent = "Запит скасовано";
      return;
    }
    if (isApiError(error)) {
      ui.formMessage.textContent = formatApiError(error);
    } else {
      ui.formMessage.textContent = "Помилка збереження";
    }
  } finally {
    setFormBusy(ui.submitBtn, ui.resetBtn, false);
    state.formAbort = null;
  }
}

async function handleDelete(id: number): Promise<void> {
  const report = state.reports.find((item) => item.id === id);
  const title = report?.title ?? `#${id}`;
  if (!window.confirm(`Видалити репорт «${title}»?`)) {
    return;
  }

  setFormBusy(ui.submitBtn, ui.resetBtn, true);
  try {
    await deleteReport(id);
    if (state.editingId === id) {
      resetFormUi(ui);
      state.editingId = null;
    }
    hideDetail(ui.detailPanel);
    showNotice(ui.notice, "Репорт видалено", "success");
    await loadReports();
  } catch (error) {
    if (isApiError(error)) {
      showNotice(ui.notice, formatApiError(error), "error");
    }
  } finally {
    setFormBusy(ui.submitBtn, ui.resetBtn, false);
  }
}

function attachHandlers(): void {
  ui.reportForm.addEventListener("submit", (event) => {
    void handleSubmit(event);
  });

  ui.resetBtn.addEventListener("click", () => {
    resetFormUi(ui);
    state.editingId = null;
  });

  ui.cancelEditBtn.addEventListener("click", () => {
    resetFormUi(ui);
    state.editingId = null;
  });

  ui.cancelLoadBtn.addEventListener("click", () => {
    state.listAbort?.();
  });

  ui.searchInput.addEventListener("input", () => {
    state.page = 1;
    void loadReports();
  });

  ui.severityFilter.addEventListener("change", () => {
    state.page = 1;
    void loadReports();
  });

  ui.statusFilter.addEventListener("change", () => {
    state.page = 1;
    void loadReports();
  });

  ui.sortBySelect.addEventListener("change", () => {
    state.page = 1;
    void loadReports();
  });

  ui.sortDirBtn.addEventListener("click", () => {
    ui.sortDirBtn.dataset.dir =
      ui.sortDirBtn.dataset.dir === "asc" ? "desc" : "asc";
    void loadReports();
  });

  ui.prevPageBtn.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      void loadReports();
    }
  });

  ui.nextPageBtn.addEventListener("click", () => {
    state.page += 1;
    void loadReports();
  });

  ui.reportsTableBody.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const id = Number(target.dataset.id);
    if (!id) return;

    if (target.classList.contains("view-btn")) {
      void showReportDetails(id);
    } else if (target.classList.contains("edit-btn")) {
      void startEdit(id);
    } else if (target.classList.contains("delete-btn")) {
      void handleDelete(id);
    }
  });

  ui.demoUserSelect.addEventListener("change", () => {
    const nextId = Number(ui.demoUserSelect.value);
    if (!nextId) return;
    setDemoUserId(nextId);
    ui.userSelect.value = String(nextId);
    clearNotice(ui.notice);
    showNotice(
      ui.notice,
      `Поточний користувач: id=${nextId} (заголовок X-Demo-UserId)`,
      "info",
    );
  });
}

async function bootstrap(): Promise<void> {
  attachHandlers();
  ui.sortDirBtn.dataset.dir = "desc";

  try {
    state.users = await getUsers();
    renderUsersSelect(ui.userSelect, state.users);
    renderDemoUserSelect(ui.demoUserSelect, state.users, getDemoUserId());
    ui.userSelect.value = String(getDemoUserId());
    await loadReports();
  } catch (error) {
    if (isApiError(error)) {
      showNotice(ui.notice, formatApiError(error), "error");
    } else {
      showNotice(
        ui.notice,
        "Не вдалося підключитися до API. Запустіть lab2-api на порту 3000.",
        "error",
      );
    }
  }
}

void bootstrap();
