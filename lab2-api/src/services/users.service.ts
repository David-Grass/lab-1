import type {
  CreateUserRequestDto,
  PatchUserRequestDto,
  UpdateUserRequestDto,
  UserListQuery,
  UserResponseDto,
} from "../dtos/users.dto.js";
import { toUserResponse } from "../dtos/users.dto.js";
import { ApiError } from "../errors/api-error.js";
import { usersRepository } from "../repositories/users.repository.js";
import { type ListResponse } from "../types/index.js";

export class UsersService {
  async list(query: UserListQuery): Promise<ListResponse<UserResponseDto>> {
    const result = await usersRepository.list(query);
    return {
      data: result.items.map(toUserResponse),
      meta: {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  }

  async getById(id: number): Promise<UserResponseDto> {
    const user = await usersRepository.getById(id);
    if (!user) {
      throw new ApiError(404, "NOT_FOUND", "User not found", `id=${id}`);
    }
    return toUserResponse(user);
  }

  async create(dto: CreateUserRequestDto): Promise<UserResponseDto> {
    const user = await usersRepository.add(dto.name, dto.email);
    return toUserResponse(user);
  }

  async update(
    id: number,
    dto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    const updated = await usersRepository.update(id, dto);
    if (!updated) {
      throw new ApiError(404, "NOT_FOUND", "User not found", `id=${id}`);
    }
    return toUserResponse(updated);
  }

  async patch(id: number, dto: PatchUserRequestDto): Promise<UserResponseDto> {
    return this.update(id, dto);
  }

  async delete(id: number): Promise<void> {
    const deleted = await usersRepository.delete(id);
    if (!deleted) {
      throw new ApiError(404, "NOT_FOUND", "User not found", `id=${id}`);
    }
  }
}

export const usersService = new UsersService();
