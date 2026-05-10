import { db } from "@ody/db/client";
import { users } from "@ody/db/schema";
import { Role, toUserId, User, type UserId, type UserRepository } from "@ody/domain/identity";
import { type DomainError, Email, type Result } from "@ody/domain/shared-kernel";
import { eq } from "drizzle-orm";
import { runQuery } from "../../../shared/run-query.js";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

const rowToUser = (row: UserRow): User | null => {
  const emailVo = Email.create(row.email);

  if (!emailVo.ok) return null;

  const roleVo = Role.create(row.role);
  const role = roleVo.ok ? roleVo.value : Role.server;

  return User.restore({
    id: toUserId(row.id),
    email: emailVo.value,
    name: row.name,
    role,
    createdAt: row.createdAt,
  });
};

export class DrizzleUserRepository implements UserRepository {
  findById(id: UserId): Promise<Result<User | null, DomainError>> {
    return runQuery(async () => {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const r = rows[0];

      return r ? rowToUser(r as UserRow) : null;
    });
  }

  findByEmail(email: Email): Promise<Result<User | null, DomainError>> {
    return runQuery(async () => {
      const rows = await db.select().from(users).where(eq(users.email, email.value)).limit(1);
      const r = rows[0];

      return r ? rowToUser(r as UserRow) : null;
    });
  }

  save(user: User): Promise<Result<void, DomainError>> {
    return runQuery(async () => {
      await db
        .insert(users)
        .values({
          id: user.id,
          email: user.email.value,
          name: user.name,
          role: user.role.value,
          createdAt: user.createdAt,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: user.email.value,
            name: user.name,
            role: user.role.value,
          },
        });
    });
  }
}

export const userRepository = new DrizzleUserRepository();
