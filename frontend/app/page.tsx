import VCWorkspace from "./vc-workspace";
import { getAppUser } from "./app-auth";
import { chatGPTSignInPath } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getAppUser();
  if (!user) {
    return <main className="auth-shell"><section className="auth-card"><span className="auth-mark" aria-hidden="true">VC</span><span className="section-kicker">The VC Brain · Secure workspace</span><h1>Sign in to your investment operating system.</h1><p>Access is limited to approved members of your firm. Identity is verified through OAuth and every shared workflow change is attributed.</p><a className="primary-button auth-button" href={chatGPTSignInPath("/")}>Sign in with ChatGPT</a><small>Authentication identifies you. Workspace membership and authorization are enforced separately.</small></section></main>;
  }
  return <VCWorkspace currentUser={user} />;
}
