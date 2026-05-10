import { createAuthClient } from "better-auth/react";
import { apiBaseUrl } from "./api-client";

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
