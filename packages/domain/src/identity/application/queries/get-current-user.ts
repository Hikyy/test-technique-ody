import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { User } from "../../domain/entities/user.js";
import type { UserRepository } from "../../domain/repositories/user.repository.js";
import type { UserId } from "../../domain/value-objects/user-id.js";

export interface GetCurrentUserDeps {
  users: UserRepository;
}

export const getCurrentUser = async (
  input: { userId: UserId },
  deps: GetCurrentUserDeps,
): Promise<Result<User, DomainError>> => {
  const found = await deps.users.findById(input.userId);
  if (!found.ok) return found;
  if (found.value === null) {
    return Err(new NotFoundError("User", input.userId));
  }
  return Ok(found.value);
};

export const getCurrentUserAction = {
  execute: getCurrentUser,
} as const;
