export const SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const STATUSES = ["Open", "InProgress", "Resolved", "Closed"] as const;
export type Status = (typeof STATUSES)[number];

export type User = {
  id: number;
  name: string;
  email: string;
};

export type Report = {
  id: number;
  title: string;
  severity: Severity;
  status: Status;
  description: string;
  reporter: string;
};

export type ListResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details: Array<{ field: string; message: string }> | null;
  };
};
