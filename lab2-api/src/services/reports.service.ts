import {
  compareReports,
  type CreateReportRequestDto,
  type PatchReportRequestDto,
  type ReportListQuery,
  type ReportResponseDto,
  type UpdateReportRequestDto,
  toReportResponse,
} from "../dtos/reports.dto.js";
import { ApiError } from "../errors/api-error.js";
import { reportsRepository } from "../repositories/reports.repository.js";
import { type ListResponse } from "../types/index.js";
import { nextReportId } from "../utils/id-generator.js";

export class ReportsService {
  list(query: ReportListQuery): ListResponse<ReportResponseDto> {
    let result = reportsRepository.getAll();

    if (query.search) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query.search!) ||
          item.description.toLowerCase().includes(query.search!) ||
          item.reporter.toLowerCase().includes(query.search!),
      );
    }

    if (query.severity) {
      result = result.filter((item) => item.severity === query.severity);
    }

    if (query.status) {
      result = result.filter((item) => item.status === query.status);
    }

    result.sort((a, b) => compareReports(a, b, query.sortBy, query.sortDir));

    const total = result.length;
    const start = (query.page - 1) * query.pageSize;
    const items = result
      .slice(start, start + query.pageSize)
      .map(toReportResponse);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  getById(id: number): ReportResponseDto {
    const report = reportsRepository.getById(id);
    if (!report) {
      throw new ApiError(404, "NOT_FOUND", "Report not found");
    }
    return toReportResponse(report);
  }

  create(dto: CreateReportRequestDto): ReportResponseDto {
    this.assertNoDuplicate(dto.title, dto.reporter);

    const report = reportsRepository.add({
      id: nextReportId(),
      ...dto,
    });

    return toReportResponse(report);
  }

  update(id: number, dto: UpdateReportRequestDto): ReportResponseDto {
    const existing = reportsRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Report not found");
    }

    this.assertNoDuplicate(dto.title, dto.reporter, id);

    const updated = reportsRepository.update(id, { ...dto });

    return toReportResponse(updated!);
  }

  patch(id: number, dto: PatchReportRequestDto): ReportResponseDto {
    const existing = reportsRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Report not found");
    }

    const nextTitle = dto.title ?? existing.title;
    const nextReporter = dto.reporter ?? existing.reporter;
    this.assertNoDuplicate(nextTitle, nextReporter, id);

    const updated = reportsRepository.update(id, { ...dto });

    return toReportResponse(updated!);
  }

  delete(id: number): void {
    const deleted = reportsRepository.delete(id);
    if (!deleted) {
      throw new ApiError(404, "NOT_FOUND", "Report not found");
    }
  }

  private assertNoDuplicate(
    title: string,
    reporter: string,
    excludeId?: number,
  ): void {
    const duplicate = reportsRepository.findDuplicate(
      title,
      reporter,
      excludeId,
    );
    if (duplicate) {
      throw new ApiError(
        409,
        "CONFLICT",
        "Report with the same title and reporter already exists",
      );
    }
  }
}

export const reportsService = new ReportsService();
