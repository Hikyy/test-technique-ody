import { getCurrentUserAction, toUserId, UserData } from "@ody/domain/identity";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { userRepository } from "../../repositories.js";

export const ShowCurrentUserController = {
  tag: "identity",
  summary: "Get the current authenticated user",
  response: { single: UserData.schema, description: "Current user" },

  async __invoke({ context }) {
    const user = await getCurrentUserAction.execute(
      { userId: toUserId(context.var.user.id) },
      { users: userRepository },
    );

    if (!user.ok) return user;

    return UserData.fromModel(user.value);
  },
} satisfies ControllerSpec;
