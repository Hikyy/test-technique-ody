import type { Email } from "../../../shared-kernel/email.js";
import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { User } from "../entities/user.js";
import type { UserId } from "../value-objects/user-id.js";

export interface UserRepository {
  findById(id: UserId): Promise<Result<User | null, DomainError>>;
  findByEmail(email: Email): Promise<Result<User | null, DomainError>>;
  save(user: User): Promise<Result<void, DomainError>>;
}
