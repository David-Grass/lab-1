export const API_BASE_URL = import.meta.env.DEV
  ? "/api/v1"
  : "http://localhost:3000/api/v1";
export const REQUEST_TIMEOUT_MS = 15_000;
