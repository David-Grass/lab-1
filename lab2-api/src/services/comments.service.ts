import {
  type CommentListQuery,
  type CommentResponseDto,
  type CommentWithDetailsResponseDto,
  type CreateCommentRequestDto,
  type PatchCommentRequestDto,
  type UpdateCommentRequestDto,
  toCommentResponse,
  toCommentWithDetailsResponse,
} from "../dtos/comments.dto.js";
import { ApiError } from "../errors/api-error.js";
import { commentsRepository } from "../repositories/comments.repository.js";
import { reportsRepository } from "../repositories/reports.repository.js";
import { usersRepository } from "../repositories/users.repository.js";
import { type ListResponse } from "../types/index.js";

export class CommentsService {
  async list(
    query: CommentListQuery,
  ): Promise<ListResponse<CommentWithDetailsResponseDto>> {
    const result = await commentsRepository.list(query);
    return {
      data: result.items.map(toCommentWithDetailsResponse),
      meta: {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  }

  async getById(id: number): Promise<CommentWithDetailsResponseDto> {
    const comment = await commentsRepository.getByIdWithDetails(id);
    if (!comment) {
      throw new ApiError(404, "NOT_FOUND", "Comment not found", `id=${id}`);
    }
    return toCommentWithDetailsResponse(comment);
  }

  async create(dto: CreateCommentRequestDto): Promise<CommentResponseDto> {
    await this.assertReportExists(dto.reportId);
    await this.assertUserExists(dto.userId);

    const comment = await commentsRepository.add(
      dto.reportId,
      dto.userId,
      dto.body,
    );
    return toCommentResponse(comment);
  }

  async update(
    id: number,
    dto: UpdateCommentRequestDto,
  ): Promise<CommentResponseDto> {
    const existing = await commentsRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Comment not found", `id=${id}`);
    }

    await this.assertReportExists(dto.reportId);
    await this.assertUserExists(dto.userId);

    const updated = await commentsRepository.update(id, { ...dto });
    return toCommentResponse(updated!);
  }

  async patch(
    id: number,
    dto: PatchCommentRequestDto,
  ): Promise<CommentResponseDto> {
    const existing = await commentsRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Comment not found", `id=${id}`);
    }

    const nextReportId = dto.reportId ?? existing.reportId;
    const nextUserId = dto.userId ?? existing.userId;
    await this.assertReportExists(nextReportId);
    await this.assertUserExists(nextUserId);

    const updated = await commentsRepository.update(id, { ...dto });
    return toCommentResponse(updated!);
  }

  async delete(id: number): Promise<void> {
    const deleted = await commentsRepository.delete(id);
    if (!deleted) {
      throw new ApiError(404, "NOT_FOUND", "Comment not found", `id=${id}`);
    }
  }

  private async assertReportExists(reportId: number): Promise<void> {
    const report = await reportsRepository.getById(reportId);
    if (!report) {
      throw new ApiError(
        400,
        "FOREIGN_KEY_CONSTRAINT",
        "Foreign key constraint violation",
        `No report with id ${reportId}`,
      );
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
}

export const commentsService = new CommentsService();
