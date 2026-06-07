import { ApiError } from "../errors/api-error.js";

export function assertReportOwner(
  ownerUserId: number,
  currentUserId: number,
): void {
  if (ownerUserId !== currentUserId) {
    throw new ApiError(403, "FORBIDDEN", "Access denied to this report", null);
  }
}
