import { cookies } from "next/headers";
import {
  authCookieOptions,
  GOOGLE_SESSION_COOKIE,
  safeRelativeReturnPath,
} from "../../../../google-auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = safeRelativeReturnPath(
    requestUrl.searchParams.get("return_to"),
  );
  (await cookies()).set(
    GOOGLE_SESSION_COOKIE,
    "",
    authCookieOptions(request, 0),
  );
  return Response.redirect(new URL(returnTo, requestUrl.origin));
}
