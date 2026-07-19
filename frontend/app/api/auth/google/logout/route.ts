import { NextResponse } from "next/server";
import {
  authCookieOptions,
  GOOGLE_NONCE_COOKIE,
  GOOGLE_RETURN_TO_COOKIE,
  GOOGLE_SESSION_COOKIE,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
} from "../../../../google-auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", requestUrl.origin), {
    status: 303,
    headers: { "Cache-Control": "no-store" },
  });
  const expired = authCookieOptions(request, 0);
  [
    GOOGLE_SESSION_COOKIE,
    GOOGLE_STATE_COOKIE,
    GOOGLE_VERIFIER_COOKIE,
    GOOGLE_NONCE_COOKIE,
    GOOGLE_RETURN_TO_COOKIE,
  ].forEach((name) => response.cookies.set(name, "", expired));
  return response;
}
