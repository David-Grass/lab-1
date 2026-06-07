import {
  type CreateReportRequestDto,
  type PatchReportRequestDto,
  type ReportListQuery,
  type ReportResponseDto,
  type ReportWithAuthorResponseDto,
  type UpdateReportRequestDto,
  toReportResponse,
  toReportWithAuthorResponse,
} from "../dtos/reports.dto.js";
import { ApiError } from "../errors/api-error.js";
import { reportsRepository } from "../repositories/reports.repository.js";
import { usersRepository } from "../repositories/users.repository.js";
import { type ListResponse, type ReportStats } from "../types/index.js";

export class ReportsService {
  async list(query: ReportListQuery): Promise<ListResponse<ReportResponseDto>> {
    const result = await reportsRepository.list(query);
    return {
      data: result.items.map(toReportResponse),
      meta: {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  }

  async listWithAuthors(
    query: ReportListQuery,
  ): Promise<ListResponse<ReportWithAuthorResponseDto>> {
    const result = await reportsRepository.listWithAuthors(query);
    return {
      data: result.items.map(toReportWithAuthorResponse),
      meta: {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  }

  async unsafeSearch(term: string): Promise<ReportWithAuthorResponseDto[]> {
    const items = await reportsRepository.unsafeSearch(term);
    return items.map(toReportWithAuthorResponse);
  }

  async getStats(): Promise<ReportStats> {
    return reportsRepository.getStats();
  }

  async getById(id: number): Promise<ReportResponseDto> {
    const report = await reportsRepository.getById(id);
    if (!report) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }
    return toReportResponse(report);
  }

  async getByIdWithAuthor(id: number): Promise<ReportWithAuthorResponseDto> {
    const report = await reportsRepository.getByIdWithAuthor(id);
    if (!report) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }
    return toReportWithAuthorResponse(report);
  }

  async create(dto: CreateReportRequestDto): Promise<ReportResponseDto> {
    await this.assertUserExists(dto.userId);
    await this.assertNoDuplicate(dto.title, dto.userId);

    const report = await reportsRepository.add(
      dto.userId,
      dto.title,
      dto.severity,
      dto.status,
      dto.description,
    );

    return toReportResponse(report);
  }

  async update(
    id: number,
    dto: UpdateReportRequestDto,
  ): Promise<ReportResponseDto> {
    const existing = await reportsRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }

    await this.assertUserExists(dto.userId);
    await this.assertNoDuplicate(dto.title, dto.userId, id);

    const updated = await reportsRepository.update(id, { ...dto });
    return toReportResponse(updated!);
  }

  async patch(
    id: number,
    dto: PatchReportRequestDto,
  ): Promise<ReportResponseDto> {
    const existing = await reportsRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }

    const nextUserId = dto.userId ?? existing.userId;
    const nextTitle = dto.title ?? existing.title;
    await this.assertUserExists(nextUserId);
    await this.assertNoDuplicate(nextTitle, nextUserId, id);

    const updated = await reportsRepository.update(id, { ...dto });
    return toReportResponse(updated!);
  }

  async delete(id: number): Promise<void> {
    const deleted = await reportsRepository.delete(id);
    if (!deleted) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }
  }

  private async assertUserExists(userId: number): Promise<void> {
    const user = await usersRepository.getById(userId);
    if (!user) {
      throw new ApiError(
        400,
        "FOREIGN_KEY_CONSTRAINT",
        "Foreign key constraint violation",
        `No user with id ${userId}`,
      );
    }
  }

  private async assertNoDuplicate(
    title: string,
    userId: number,
    excludeId?: number,
  ): Promise<void> {
    const duplicate = await reportsRepository.findDuplicate(
      title,
      userId,
      excludeId,
    );
    if (duplicate) {
      throw new ApiError(
        409,
        "CONFLICT",
        "Report with the same title and author already exists",
        `title="${title}", userId=${userId}`,
      );
    }
  }
}

export const reportsService = new ReportsService();
