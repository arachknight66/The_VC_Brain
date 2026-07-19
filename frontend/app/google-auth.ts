import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

export type GoogleUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

export const GOOGLE_SESSION_COOKIE = "vc_brain_google_session";
export const GOOGLE_STATE_COOKIE = "vc_brain_google_state";
export const GOOGLE_VERIFIER_COOKIE = "vc_brain_google_verifier";
export const GOOGLE_NONCE_COOKIE = "vc_brain_google_nonce";
export const GOOGLE_RETURN_TO_COOKIE = "vc_brain_google_return_to";
export const GOOGLE_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const GOOGLE_FLOW_TTL_SECONDS = 10 * 60;

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

function environmentList(value: string | undefined) {
  return (value || "")
    .split(/[\s,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function allowAnyGoogleAccount() {
  return process.env.GOOGLE_ALLOW_ANY_ACCOUNT?.trim().toLowerCase() === "true";
}

function sessionSecret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (value && value.length >= 32) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === "development") {
    return new TextEncoder().encode("vc-brain-local-development-secret");
  }
  return null;
}

export function googleOAuthConfigured() {
  const membershipPolicyConfigured = Boolean(
    allowAnyGoogleAccount() ||
      process.env.GOOGLE_WORKSPACE_DOMAIN?.trim() ||
      process.env.GOOGLE_ALLOWED_EMAILS?.trim() ||
      process.env.NODE_ENV === "development",
  );
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      sessionSecret() &&
      membershipPolicyConfigured,
  );
}

export function safeRelativeReturnPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    if (url.pathname.startsWith("/api/auth/")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function randomBase64Url(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  let binary = "";
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function createGoogleSession(user: GoogleUser) {
  const secret = sessionSecret();
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new SignJWT({
    email: user.email,
    name: user.displayName,
    fullName: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("vc-brain")
    .setAudience("vc-brain-web")
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime(`${GOOGLE_SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

export async function getGoogleUser(): Promise<GoogleUser | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const token = (await cookies()).get(GOOGLE_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "vc-brain",
      audience: "vc-brain-web",
      algorithms: ["HS256"],
    });
    if (typeof payload.email !== "string" || !payload.email) return null;
    const displayName =
      typeof payload.name === "string" && payload.name
        ? payload.name
        : payload.email;
    return {
      email: payload.email.toLowerCase(),
      displayName,
      fullName:
        typeof payload.fullName === "string" ? payload.fullName : displayName,
    };
  } catch {
    return null;
  }
}

export function assertGoogleUserAllowed(email: string) {
  const normalized = email.trim().toLowerCase();
  if (allowAnyGoogleAccount()) return;
  const allowedEmails = new Set(environmentList(process.env.GOOGLE_ALLOWED_EMAILS));
  const allowedDomains = environmentList(process.env.GOOGLE_WORKSPACE_DOMAIN).map(
    (domain) => domain.replace(/^@/, ""),
  );
  const domainMatches = allowedDomains.some((domain) =>
    normalized.endsWith(`@${domain}`),
  );
  if (allowedEmails.has(normalized) || domainMatches) return;
  if (
    process.env.NODE_ENV === "development" &&
    !allowedEmails.size &&
    !allowedDomains.length
  ) {
    return;
  }
  throw new Error(
    `The Google account ${normalized} is not approved for The VC Brain`,
  );
}

export async function verifyGoogleIdToken(idToken: string, nonce: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured");
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    audience: clientId,
    issuer: GOOGLE_ISSUERS,
    algorithms: ["RS256"],
  });
  if (payload.nonce !== nonce) throw new Error("Invalid Google login nonce");
  if (payload.email_verified !== true || typeof payload.email !== "string") {
    throw new Error("Google did not provide a verified email address");
  }
  assertGoogleUserAllowed(payload.email);
  const displayName =
    typeof payload.name === "string" && payload.name
      ? payload.name
      : payload.email;
  return {
    email: payload.email.toLowerCase(),
    displayName,
    fullName: displayName,
  } satisfies GoogleUser;
}

export function authCookieOptions(request: Request, maxAge: number) {
  return {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
