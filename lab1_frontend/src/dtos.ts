export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Status = "Open" | "InProgress" | "Resolved" | "Closed";

export type ReportDto = {
  id: number;
  userId: number;
  title: string;
  severity: Severity;
  status: Status;
  description: string;
};

export type ReportWithAuthorDto = ReportDto & {
  authorName: string;
  authorEmail: string;
};

export type UserDto = {
  id: number;
  name: string;
  email: string;
};

export type ListMeta = {
  total: number;
  page?: number;
  pageSize?: number;
};

export type ListResponse<T> = {
  data: T[];
  meta: ListMeta;
};

export type ItemResponse<T> = {
  data: T;
};

export type CreateReportDto = {
  userId: number;
  title: string;
  severity: Severity;
  status: Status;
  description: string;
};

export type UpdateReportDto = CreateReportDto;

export type ApiErrorPayload = {
  status: number;
  code: string;
  message: string;
  details: string | null;
};

export type ReportListQuery = {
  search?: string;
  severity?: Severity | "";
  status?: Status | "";
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type ReportFormValues = {
  userId: string;
  title: string;
  severity: Severity | "";
  status: Status;
  description: string;
};

export type FieldErrors = Partial<Record<keyof ReportFormValues, string>>;

export type CommentDto = {
  id: number;
  reportId: number;
  userId: number;
  body: string;
  authorName: string;
  reportTitle: string;
};
