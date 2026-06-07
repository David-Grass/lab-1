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
  userId: number;
  title: string;
  severity: Severity;
  status: Status;
  description: string;
};

export type ReportWithAuthor = Report & {
  authorName: string;
  authorEmail: string;
};

export type ReportComment = {
  id: number;
  reportId: number;
  userId: number;
  body: string;
};

export type ReportCommentWithDetails = ReportComment & {
  authorName: string;
  reportTitle: string;
};

export type ListResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page?: number;
    pageSize?: number;
  };
};

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details: string | null;
  };
};

export type ReportStats = {
  total: number;
  bySeverity: Record<Severity, number>;
  byStatus: Record<Status, number>;
  avgCommentsPerReport: number;
};
