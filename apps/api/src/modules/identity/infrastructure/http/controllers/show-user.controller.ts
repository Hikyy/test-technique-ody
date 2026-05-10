import { getCurrentUserAction, toUserId, UserData } from "@ody/domain/identity";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { userRepository } from "../../repositories.js";

export const ShowUserController = {
  tag: "identity",
  summary: "Get a user by id (admin only)",
  params: z.object({ id: z.string().min(1) }),
  response: { single: UserData.schema, description: "User" },

  async __invoke({ params }) {
    const user = await getCurrentUserAction.execute({ userId: toUserId(params.id) }, { users: userRepository });

    if (!user.ok) return user;

    return UserData.fromModel(user.value);
  },
} satisfies ControllerSpec;
