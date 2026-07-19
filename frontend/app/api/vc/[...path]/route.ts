import { getAppUser } from "../../../app-auth";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  const user = await getAppUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  const { path } = await context.params;
  const incoming = new URL(request.url);
  const base = (process.env.VC_BRAIN_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  const target = new URL(`${base}/${path.map(encodeURIComponent).join("/")}`);
  target.search = incoming.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);
  headers.set("x-vc-brain-user-email", user.email);
  if (process.env.VC_BRAIN_SERVICE_TOKEN) headers.set("x-vc-brain-service-token", process.env.VC_BRAIN_SERVICE_TOKEN);

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: "manual",
    });
    const responseHeaders = new Headers();
    const responseType = response.headers.get("content-type");
    if (responseType) responseHeaders.set("content-type", responseType);
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: "Analysis service unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
