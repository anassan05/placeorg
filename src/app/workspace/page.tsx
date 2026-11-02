import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentActor, SESSION_COOKIE } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
export const dynamic = "force-dynamic";
export default async function Workspace() {
  let actor;
  try { actor = await currentActor((await cookies()).get(SESSION_COOKIE)?.value); }
  catch { return <main className="auth-shell"><section className="auth-card"><h1>Temporarily unavailable.</h1><p>We couldn’t verify your session. Please try again later.</p><Link href="/">Back to home</Link></section></main>; }
  if (!actor || !can(actor, "session:read")) redirect("/login");
  return <main className="auth-shell"><div className="auth-top"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">C<span>✳</span></span><span>campus<span className="brand-light">connect</span></span></Link><form action="/api/auth/logout" method="post"><button className="text-link" type="submit">Sign out ↗</button></form></div>
    <section className="auth-card"><p className="eyebrow green"><span className="dot"/> SIGNED IN</p><h1>Your workspace.</h1><p>Signed in as <strong>{actor.email}</strong>.</p><p className="role-badge">{actor.role.replaceAll("_", " ")}</p><p>Placement tools and institutional workflows are still being built. This page currently displays only your account details.</p></section>
  </main>;
}
