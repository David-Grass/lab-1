import { SEVERITIES, STATUSES } from "./constants";
import type { FieldErrors, ReportFormValues, Severity, Status } from "./dtos";

export function validateReportForm(values: ReportFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const userId = Number(values.userId);
  if (!values.userId || !Number.isInteger(userId) || userId < 1) {
    errors.userId = "Оберіть автора репорту";
  }

  const title = values.title.trim();
  if (title.length < 3) {
    errors.title = "Назва має містити щонайменше 3 символи";
  } else if (title.length > 80) {
    errors.title = "Назва не може перевищувати 80 символів";
  }

  if (!values.severity || !SEVERITIES.includes(values.severity as Severity)) {
    errors.severity = "Оберіть критичність";
  }

  if (!STATUSES.includes(values.status)) {
    errors.status = "Оберіть статус";
  }

  const description = values.description.trim();
  if (description.length < 10) {
    errors.description = "Опис має містити щонайменше 10 символів";
  } else if (description.length > 500) {
    errors.description = "Опис не може перевищувати 500 символів";
  }

  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formValuesToDto(values: ReportFormValues) {
  return {
    userId: Number(values.userId),
    title: values.title.trim(),
    severity: values.severity as Severity,
    status: values.status as Status,
    description: values.description.trim(),
  };
}
