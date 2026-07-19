import Link from "next/link";
import VCWorkspace from "./vc-workspace";
import { getAppUser } from "./app-auth";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ auth_error?: string }>;
}) {
  const user = await getAppUser();
  const authError = (await searchParams)?.auth_error;
  if (!user) {
    return <main className="auth-shell"><section className="auth-card"><span className="auth-mark" aria-hidden="true">VC</span><span className="section-kicker">The VC Brain · Secure workspace</span><h1>Sign in to your investment operating system.</h1><p>Access is limited to approved Google accounts at your firm. Every shared workflow change is attributed to the authenticated investor.</p>{authError && <p className="auth-error" role="alert">{authError}</p>}<Link className="primary-button auth-button" href="/api/auth/google/start?return_to=%2F"><span className="google-g" aria-hidden="true">G</span> Continue with Google</Link><small>Google verifies your identity. Firm membership and workspace permissions are enforced separately.</small></section></main>;
  }
  return <VCWorkspace currentUser={user} />;
}
