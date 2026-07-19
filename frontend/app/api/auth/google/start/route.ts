import { cookies } from "next/headers";
import {
  authCookieOptions,
  GOOGLE_FLOW_TTL_SECONDS,
  GOOGLE_NONCE_COOKIE,
  GOOGLE_RETURN_TO_COOKIE,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  googleOAuthConfigured,
  randomBase64Url,
  safeRelativeReturnPath,
  sha256Base64Url,
} from "../../../../google-auth";

export async function GET(request: Request) {
  if (!googleOAuthConfigured()) {
    return Response.json(
      { error: "Google OAuth is not configured" },
      { status: 503 },
    );
  }

  const requestUrl = new URL(request.url);
  const state = randomBase64Url();
  const nonce = randomBase64Url();
  const verifier = randomBase64Url(64);
  const codeChallenge = await sha256Base64Url(verifier);
  const returnTo = safeRelativeReturnPath(
    requestUrl.searchParams.get("return_to"),
  );
  const redirectUri = `${requestUrl.origin}/api/auth/google/callback`;
  const jar = await cookies();
  const options = authCookieOptions(request, GOOGLE_FLOW_TTL_SECONDS);
  jar.set(GOOGLE_STATE_COOKIE, state, options);
  jar.set(GOOGLE_NONCE_COOKIE, nonce, options);
  jar.set(GOOGLE_VERIFIER_COOKIE, verifier, options);
  jar.set(GOOGLE_RETURN_TO_COOKIE, returnTo, options);

  const authorizationUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth",
  );
  authorizationUrl.searchParams.set(
    "client_id",
    process.env.GOOGLE_CLIENT_ID!.trim(),
  );
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("prompt", "select_account");

  return Response.redirect(authorizationUrl);
}
