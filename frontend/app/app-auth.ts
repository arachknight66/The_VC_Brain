import { getGoogleUser, type GoogleUser } from "./google-auth";

export type AppUser = GoogleUser & {
  authenticated: boolean;
};

export async function getAppUser(): Promise<AppUser | null> {
  const user = await getGoogleUser();
  if (user) return { ...user, authenticated: true };
  return null;
}
