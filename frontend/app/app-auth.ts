import { getChatGPTUser, type ChatGPTUser } from "./chatgpt-auth";

export type AppUser = ChatGPTUser & {
  authenticated: boolean;
};

export async function getAppUser(): Promise<AppUser | null> {
  const user = await getChatGPTUser();
  if (user) return { ...user, authenticated: true };

  if (process.env.NODE_ENV === "development") {
    return {
      displayName: "Local Developer",
      email: "developer@local.vcbrain",
      fullName: "Local Developer",
      authenticated: false,
    };
  }

  return null;
}
