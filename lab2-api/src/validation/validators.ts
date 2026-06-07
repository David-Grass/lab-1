import { ApiError } from "../errors/api-error.js";

export type ValidationDetail = {
  field: string;
  message: string;
};

export function requireString(
  value: unknown,
  fieldName: string,
  minLen = 1,
  maxLen?: number,
): ValidationDetail | null {
  if (typeof value !== "string" || value.trim().length < minLen) {
    return {
      field: fieldName,
      message: `${fieldName} must be a non-empty string (min ${minLen} chars)`,
    };
  }

  if (maxLen !== undefined && value.trim().length > maxLen) {
    return {
      field: fieldName,
      message: `${fieldName} must be at most ${maxLen} characters`,
    };
  }

  return null;
}

export function requireOneOf<T extends string>(
  value: unknown,
  fieldName: string,
  allowed: readonly T[],
): ValidationDetail | null {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${allowed.join(", ")}`,
    };
  }

  return null;
}

export function requireEmail(
  value: unknown,
  fieldName: string,
): ValidationDetail | null {
  const base = requireString(value, fieldName, 5, 120);
  if (base) return base;

  const email = (value as string).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid email address`,
    };
  }

  return null;
}

export function collectErrors(
  checks: Array<ValidationDetail | null>,
): ValidationDetail[] {
  return checks.filter((item): item is ValidationDetail => item !== null);
}

export function formatValidationDetails(errors: ValidationDetail[]): string {
  return errors.map((item) => `${item.field}: ${item.message}`).join("; ");
}

export function assertValid(errors: ValidationDetail[]): void {
  if (errors.length === 0) return;
  throw new ApiError(
    400,
    "VALIDATION_ERROR",
    "Invalid request body",
    formatValidationDetails(errors),
  );
}
