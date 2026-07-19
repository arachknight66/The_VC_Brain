import { ArrowRight, CheckCircle2, LockKeyhole, Radar, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import VCWorkspace from "./vc-workspace";
import { getAppUser } from "./app-auth";

export const dynamic = "force-dynamic";

const loginHref = "/api/auth/google/start?return_to=%2F";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ auth_error?: string }>;
}) {
  const user = await getAppUser();
  const authError = (await searchParams)?.auth_error;

  if (user) return <VCWorkspace currentUser={user} />;

  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="Landing navigation">
        <div className="logo" aria-label="The VC Brain">
          <span className="logo-mark">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>The VC Brain</strong>
            <small>Investment OS</small>
          </span>
        </div>
        <Link prefetch={false} className="secondary-button" href={loginHref}>
          Sign in
          <ArrowRight size={14} />
        </Link>
      </nav>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <span className="section-kicker">
            <Sparkles size={14} />
            Evidence-first venture workspace
          </span>
          <h1 id="landing-title">The VC Brain</h1>
          <p>
            Move from sourcing signal to diligence memo with provenance, confidence, and shared investor workflows in one quiet operating system.
          </p>
          {authError && (
            <p className="auth-error landing-error" role="alert">
              {authError}
            </p>
          )}
          <div className="landing-actions">
            <Link prefetch={false} className="primary-button landing-primary" href={loginHref}>
              Continue with Google
              <ArrowRight size={16} />
            </Link>
            <span className="login-assurance">
              <LockKeyhole size={14} />
              Approved firm accounts only
            </span>
          </div>
        </div>

        <div className="landing-preview" aria-label="Investment workflow preview">
          <div className="preview-toolbar">
            <span>Priority queue</span>
            <strong>Today</strong>
          </div>
          <div className="preview-score">
            <span>Founder fit</span>
            <strong>86</strong>
            <small>High-confidence evidence</small>
          </div>
          <div className="preview-list">
            <span>
              <Radar size={15} />
              GitHub build signal verified
            </span>
            <span>
              <ShieldCheck size={15} />
              Claims mapped to source record
            </span>
            <span>
              <CheckCircle2 size={15} />
              IC memo ready for review
            </span>
          </div>
        </div>
      </section>

      <section className="landing-band" aria-label="Workspace capabilities">
        {[
          ["Signal inbox", "Rank new opportunities by relevance, novelty, and source confidence."],
          ["Diligence memory", "Keep evidence, claims, tasks, and reviewer decisions attached to every company."],
          ["IC workflow", "Turn scored context into accountable partner review and portfolio monitoring."],
        ].map(([title, detail]) => (
          <article key={title}>
            <strong>{title}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
