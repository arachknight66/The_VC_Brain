import { cookies } from "next/headers";
import {
  authCookieOptions,
  createGoogleSession,
  GOOGLE_NONCE_COOKIE,
  GOOGLE_RETURN_TO_COOKIE,
  GOOGLE_SESSION_COOKIE,
  GOOGLE_SESSION_TTL_SECONDS,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  safeRelativeReturnPath,
  verifyGoogleIdToken,
} from "../../../../google-auth";

function clearFlowCookies(
  jar: Awaited<ReturnType<typeof cookies>>,
  request: Request,
) {
  const expired = authCookieOptions(request, 0);
  for (const name of [
    GOOGLE_STATE_COOKIE,
    GOOGLE_NONCE_COOKIE,
    GOOGLE_VERIFIER_COOKIE,
    GOOGLE_RETURN_TO_COOKIE,
  ]) {
    jar.set(name, "", expired);
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const jar = await cookies();
  const state = jar.get(GOOGLE_STATE_COOKIE)?.value;
  const nonce = jar.get(GOOGLE_NONCE_COOKIE)?.value;
  const verifier = jar.get(GOOGLE_VERIFIER_COOKIE)?.value;
  const returnTo = safeRelativeReturnPath(
    jar.get(GOOGLE_RETURN_TO_COOKIE)?.value,
  );
  const receivedState = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");

  try {
    const oauthError = requestUrl.searchParams.get("error");
    if (oauthError) {
      const description = requestUrl.searchParams.get("error_description");
      throw new Error(
        description ||
          (oauthError === "access_denied"
            ? "Google sign-in was cancelled or this account does not have access"
            : `Google sign-in failed: ${oauthError}`),
      );
    }
    if (!state || !receivedState || state !== receivedState) {
      throw new Error("Invalid Google login state");
    }
    if (!nonce || !verifier || !code) {
      throw new Error("Incomplete Google login response");
    }

    const redirectUri = `${requestUrl.origin}/api/auth/google/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID?.trim() || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET?.trim() || "",
        code,
        code_verifier: verifier,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    const tokens = (await tokenResponse.json()) as {
      id_token?: string;
      error_description?: string;
    };
    if (!tokenResponse.ok || !tokens.id_token) {
      throw new Error(tokens.error_description || "Google token exchange failed");
    }

    const user = await verifyGoogleIdToken(tokens.id_token, nonce);
    const session = await createGoogleSession(user);
    jar.set(
      GOOGLE_SESSION_COOKIE,
      session,
      authCookieOptions(request, GOOGLE_SESSION_TTL_SECONDS),
    );
    clearFlowCookies(jar, request);
    return Response.redirect(new URL(returnTo, requestUrl.origin));
  } catch (error) {
    clearFlowCookies(jar, request);
    const message =
      error instanceof Error ? error.message : "Google sign-in failed";
    const failure = new URL("/", requestUrl.origin);
    failure.searchParams.set("auth_error", message);
    return Response.redirect(failure);
  }
}
