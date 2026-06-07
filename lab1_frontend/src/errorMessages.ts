import type { ApiErrorPayload } from "./dtos";

const DEFAULT_BY_CODE: Record<string, string> = {
  CONFLICT:
    "Репорт з такою назвою вже існує у цього автора. Вкажіть іншу назву.",
  VALIDATION_ERROR:
    "Дані форми некоректні. Перевірте поля та спробуйте ще раз.",
  NOT_FOUND: "Запис не знайдено. Можливо, його вже видалено.",
  UNIQUE_CONSTRAINT: "Такий запис уже існує.",
  FOREIGN_KEY_CONSTRAINT:
    "Обраний автор не знайдений. Оновіть сторінку та оберіть користувача зі списку.",
  NOT_NULL_CONSTRAINT: "Заповніть усі обов’язкові поля.",
  CHECK_CONSTRAINT:
    "Деякі значення не відповідають правилам. Перевірте форму.",
  NETWORK_ERROR:
    "Не вдалося з’єднатися з сервером. Запустіть API (порт 3000) і оновіть сторінку.",
  INTERNAL_SERVER_ERROR:
    "На сервері сталася несподівана помилка. Спробуйте пізніше.",
  HTTP_ERROR: "Помилка сервера. Спробуйте пізніше.",
};

const FIELD_LABELS: Record<string, string> = {
  userId: "Автор",
  title: "Назва",
  severity: "Критичність",
  status: "Статус",
  description: "Опис",
  name: "Ім’я",
  email: "Email",
  reportId: "Репорт",
  body: "Текст коментаря",
};

function formatConflict(error: ApiErrorPayload): string {
  const titleMatch = error.details?.match(/title="([^"]+)"/);
  if (titleMatch) {
    return `Репорт «${titleMatch[1]}» вже існує у обраного автора. Вкажіть іншу назву.`;
  }
  return DEFAULT_BY_CODE.CONFLICT;
}

function formatNotFound(error: ApiErrorPayload): string {
  const hint = `${error.message} ${error.details ?? ""}`.toLowerCase();
  if (hint.includes("report")) {
    return "Репорт не знайдено. Можливо, його вже видалено.";
  }
  if (hint.includes("user")) {
    return "Користувача не знайдено. Оновіть сторінку.";
  }
  if (hint.includes("comment")) {
    return "Коментар не знайдено.";
  }
  return DEFAULT_BY_CODE.NOT_FOUND;
}

function formatValidation(error: ApiErrorPayload): string {
  if (!error.details) {
    return DEFAULT_BY_CODE.VALIDATION_ERROR;
  }

  const parts = error.details.split("; ").map((part) => {
    const colon = part.indexOf(": ");
    if (colon === -1) {
      return part;
    }
    const field = part.slice(0, colon);
    const label = FIELD_LABELS[field] ?? field;
    return label;
  });

  const uniqueFields = [...new Set(parts)];
  if (uniqueFields.length === 1) {
    return `Поле «${uniqueFields[0]}» заповнено некоректно.`;
  }
  if (uniqueFields.length > 1) {
    return `Перевірте поля: ${uniqueFields.join(", ")}.`;
  }

  return DEFAULT_BY_CODE.VALIDATION_ERROR;
}

export function toUserMessage(error: ApiErrorPayload): string {
  switch (error.code) {
    case "CONFLICT":
      return formatConflict(error);
    case "NOT_FOUND":
      return formatNotFound(error);
    case "VALIDATION_ERROR":
      return formatValidation(error);
    default:
      return DEFAULT_BY_CODE[error.code] ?? error.message;
  }
}
