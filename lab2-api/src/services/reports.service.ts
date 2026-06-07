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
import { assertReportOwner } from "./access-control.service.js";
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

  async search(term: string): Promise<ReportWithAuthorResponseDto[]> {
    const items = await reportsRepository.search(term);
    return items.map(toReportWithAuthorResponse);
  }

  async getStats(): Promise<ReportStats> {
    return reportsRepository.getStats();
  }

  async getById(id: number, currentUserId: number): Promise<ReportResponseDto> {
    const report = await reportsRepository.getById(id);
    if (!report) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }
    assertReportOwner(report.userId, currentUserId);
    return toReportResponse(report);
  }

  async getByIdWithAuthor(
    id: number,
    currentUserId: number,
  ): Promise<ReportWithAuthorResponseDto> {
    const report = await reportsRepository.getByIdWithAuthor(id);
    if (!report) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }
    assertReportOwner(report.userId, currentUserId);
    return toReportWithAuthorResponse(report);
  }

  async create(
    dto: CreateReportRequestDto,
    currentUserId: number,
  ): Promise<ReportResponseDto> {
    await this.assertUserExists(currentUserId);
    await this.assertNoDuplicate(dto.title, currentUserId);

    const report = await reportsRepository.add(
      currentUserId,
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
    currentUserId: number,
  ): Promise<ReportResponseDto> {
    const existing = await reportsRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }
    assertReportOwner(existing.userId, currentUserId);

    await this.assertNoDuplicate(dto.title, currentUserId, id);

    const updated = await reportsRepository.update(id, {
      userId: currentUserId,
      title: dto.title,
      severity: dto.severity,
      status: dto.status,
      description: dto.description,
    });
    return toReportResponse(updated!);
  }

  async patch(
    id: number,
    dto: PatchReportRequestDto,
    currentUserId: number,
  ): Promise<ReportResponseDto> {
    const existing = await reportsRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }
    assertReportOwner(existing.userId, currentUserId);

    const nextTitle = dto.title ?? existing.title;
    await this.assertNoDuplicate(nextTitle, currentUserId, id);

    const updated = await reportsRepository.update(id, {
      userId: currentUserId,
      title: nextTitle,
      severity: dto.severity ?? existing.severity,
      status: dto.status ?? existing.status,
      description: dto.description ?? existing.description,
    });
    return toReportResponse(updated!);
  }

  async delete(id: number, currentUserId: number): Promise<void> {
    const existing = await reportsRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Report not found", `id=${id}`);
    }
    assertReportOwner(existing.userId, currentUserId);

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
