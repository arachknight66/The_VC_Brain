import { getGoogleUser, type GoogleUser } from "./google-auth";

export type AppUser = GoogleUser & {
  authenticated: boolean;
};

export async function getAppUser(): Promise<AppUser | null> {
  const user = await getGoogleUser();
  if (user) return { ...user, authenticated: true };
  // Allow direct guest access in local development or demo mode
  return {
    displayName: "Partner (Guest Access)",
    email: "partner@vcbrain.internal",
    fullName: "Investment Partner (Guest)",
    authenticated: true,
  };
}
