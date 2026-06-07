import type {
  CreateUserRequestDto,
  PatchUserRequestDto,
  UpdateUserRequestDto,
  UserResponseDto,
} from "../dtos/users.dto.js";
import { toUserResponse } from "../dtos/users.dto.js";
import { ApiError } from "../errors/api-error.js";
import { usersRepository } from "../repositories/users.repository.js";
import { type ListResponse } from "../types/index.js";
import { nextUserId } from "../utils/id-generator.js";

export class UsersService {
  list(): ListResponse<UserResponseDto> {
    const items = usersRepository.getAll().map(toUserResponse);
    return { items, total: items.length };
  }

  getById(id: number): UserResponseDto {
    const user = usersRepository.getById(id);
    if (!user) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }
    return toUserResponse(user);
  }

  create(dto: CreateUserRequestDto): UserResponseDto {
    if (usersRepository.getByEmail(dto.email)) {
      throw new ApiError(
        409,
        "CONFLICT",
        "User with this email already exists",
      );
    }

    const user = usersRepository.add({
      id: nextUserId(),
      name: dto.name,
      email: dto.email,
    });

    return toUserResponse(user);
  }

  update(id: number, dto: UpdateUserRequestDto): UserResponseDto {
    const existing = usersRepository.getById(id);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }

    if (dto.email && dto.email !== existing.email) {
      const duplicate = usersRepository.getByEmail(dto.email);
      if (duplicate && duplicate.id !== id) {
        throw new ApiError(
          409,
          "CONFLICT",
          "User with this email already exists",
        );
      }
    }

    const updated = usersRepository.update(id, dto);
    if (!updated) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }

    return toUserResponse(updated);
  }

  patch(id: number, dto: PatchUserRequestDto): UserResponseDto {
    return this.update(id, dto);
  }

  delete(id: number): void {
    const deleted = usersRepository.delete(id);
    if (!deleted) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }
  }
}

export const usersService = new UsersService();
