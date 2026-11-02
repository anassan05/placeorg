import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="auth-shell"><div className="auth-top"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">C<span>✳</span></span><span>campus<span className="brand-light">connect</span></span></Link><Link href="/">← Back to home</Link></div>
    <section className="auth-card"><p className="eyebrow green"><span className="dot"/> YOUR WORKSPACE</p><h1>Welcome back.</h1><p>Sign in with an account provisioned by your institution.</p>
      {error === "credentials" && <p className="auth-error" role="alert">Unable to sign in. Check your details or try again later.</p>}
      <form method="post" action="/api/auth/login" className="auth-form"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" required autoComplete="username" maxLength={254} placeholder="you@institution.edu"/><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password"/><button className="button primary" type="submit">Sign in <span aria-hidden="true">↗</span></button></form>
      <p className="auth-footnote">Account invitations and password recovery are not yet available.</p>
    </section><p className="auth-caption">A MORE CONNECTED PLACEMENT JOURNEY.</p>
  </main>;
}
