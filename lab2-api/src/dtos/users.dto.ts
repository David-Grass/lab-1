import {
  assertValid,
  collectErrors,
  requireEmail,
  requireString,
} from "../validation/validators.js";

export type CreateUserRequestDto = {
  name: string;
  email: string;
};

export type UpdateUserRequestDto = {
  name?: string;
  email?: string;
};

export type PatchUserRequestDto = {
  name?: string;
  email?: string;
};

export type UserResponseDto = {
  id: number;
  name: string;
  email: string;
};

export function validateCreateUserDto(body: unknown): CreateUserRequestDto {
  if (typeof body !== "object" || body === null) {
    assertValid([
      { field: "body", message: "Request body must be a JSON object" },
    ]);
  }

  const dto = body as Record<string, unknown>;
  const errors = collectErrors([
    requireString(dto.name, "name", 2, 80),
    requireEmail(dto.email, "email"),
  ]);
  assertValid(errors);

  return {
    name: (dto.name as string).trim(),
    email: (dto.email as string).trim().toLowerCase(),
  };
}

export function validateUpdateUserDto(body: unknown): UpdateUserRequestDto {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    assertValid([
      { field: "body", message: "Request body must be a JSON object" },
    ]);
  }

  const dto = body as Record<string, unknown>;
  const errors = [];

  if (dto.name !== undefined) {
    errors.push(requireString(dto.name, "name", 2, 80));
  }
  if (dto.email !== undefined) {
    errors.push(requireEmail(dto.email, "email"));
  }
  if (dto.name === undefined && dto.email === undefined) {
    errors.push({
      field: "body",
      message: "At least one field (name or email) must be provided",
    });
  }

  assertValid(collectErrors(errors));

  const result: UpdateUserRequestDto = {};
  if (dto.name !== undefined) result.name = (dto.name as string).trim();
  if (dto.email !== undefined)
    result.email = (dto.email as string).trim().toLowerCase();
  return result;
}

export function validatePatchUserDto(body: unknown): PatchUserRequestDto {
  return validateUpdateUserDto(body);
}

export function toUserResponse(user: {
  id: number;
  name: string;
  email: string;
}): UserResponseDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
