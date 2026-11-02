const features = [
  { n: "01", icon: "⌘", title: "One connected workspace", text: "Bring placement activity together with a dedicated workspace for each institution." },
  { n: "02", icon: "↗", title: "A clearer path for students", text: "Make it easier for students to discover opportunities and follow their progress." },
  { n: "03", icon: "◎", title: "Decisions you can explain", text: "Use transparent, deterministic eligibility rules—not AI—to evaluate criteria." },
];
const steps = [
  { num: "01", title: "Set up your institution", detail: "A dedicated space for your college, departments, and placement team." },
  { num: "02", title: "Bring opportunities together", detail: "Organize company partnerships and placement drives in one place." },
  { num: "03", title: "Support every student", detail: "Help students follow their applications from registration to outcomes." },
];
export default function Home() {
  return <>
    <a className="skip" href="#main">Skip to content</a>
    <header className="site-header"><div className="wrap nav">
      <a className="brand" href="#top" aria-label="CampusConnect home"><span className="brand-mark" aria-hidden="true">C<span>✳</span></span><span>campus<span className="brand-light">connect</span></span></a>
      <nav aria-label="Main navigation"><a href="#approach">Our approach</a><a href="#how-it-works">How it works</a><a href="#status">Project status</a></nav>
      <a className="nav-link" href="#status">Explore the project <span aria-hidden="true">↗</span></a>
    </div></header>
    <main id="main">
      <section className="hero" id="top"><div className="wrap hero-inner">
        <div className="hero-copy"><p className="eyebrow"><span className="dot"/> A BETTER WAY TO CONNECT</p>
          <h1>Better placements.<br/><em>Brighter futures.</em></h1>
          <p className="hero-text">A more thoughtful way for colleges, placement teams, and students to move forward together.</p>
          <div className="hero-actions"><a className="button primary" href="#approach">Discover our approach <span aria-hidden="true">↗</span></a><a className="text-link" href="#how-it-works">How it works <span aria-hidden="true">↓</span></a></div>
          <p className="hero-note"><span aria-hidden="true">✳</span> Built with institutions and their students in mind.</p>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="art-grid"></div><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="art-center"><span className="art-star">✳</span><span>MADE FOR<br/>WHAT’S NEXT</span></div><div className="art-label label-one"><span className="small-dot"></span> COLLEGES</div><div className="art-label label-two"><span className="small-dot coral"></span> STUDENTS</div><div className="art-label label-three"><span className="small-dot gold"></span> OPPORTUNITIES</div><span className="art-caption">A LITTLE MORE CONNECTED, EVERY DAY.</span></div>
      </div><div className="wrap hero-bottom"><span>PLACEMENT MANAGEMENT, REIMAGINED</span><span>SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span></div></section>
      <section className="intro-section" id="approach"><div className="wrap"><div className="section-heading"><div><p className="eyebrow green">THE BIG PICTURE <span>— 01</span></p><h2>Good things happen<br/><em>when we connect.</em></h2></div><p>Placement is more than a process. It’s the people, possibilities, and progress that come together along the way.</p></div>
        <div className="feature-grid">{features.map(f => <article className="feature" key={f.n}><div className="feature-top"><span className="feature-icon" aria-hidden="true">{f.icon}</span><span className="feature-num">{f.n} / 03</span></div><h3>{f.title}</h3><p>{f.text}</p></article>)}</div>
      </div></section>
      <section className="process-section" id="how-it-works"><div className="wrap process-grid"><div><p className="eyebrow green">THE APPROACH <span>— 02</span></p><h2>A little structure.<br/><em>A lot of possibility.</em></h2><p className="process-intro">A connected placement journey, designed around the people who make it happen.</p><div className="process-stamp" aria-hidden="true">✳</div></div><div className="steps">{steps.map(s => <article className="step" key={s.num}><span>{s.num}</span><div><h3>{s.title}</h3><p>{s.detail}</p></div><span aria-hidden="true">↗</span></article>)}</div></div></section>
      <section className="status-section" id="status"><div className="wrap status-box"><div><p className="eyebrow">A NOTE FROM THE TEAM <span>— 03</span></p><h2>We’re building<br/><em>something meaningful.</em></h2><p>CampusConnect is under development. College onboarding, accounts, and placement workflows are not available yet.</p></div><div className="status-side"><span className="status-pill"><span className="dot"/> IN DEVELOPMENT</span><p>Follow along as we build a more connected placement journey.</p><a href="/api/health" className="button light">View liveness endpoint <span aria-hidden="true">↗</span></a></div></div></section>
    </main>
    <footer><div className="wrap footer-inner"><a className="brand" href="#top"><span className="brand-mark" aria-hidden="true">C<span>✳</span></span><span>campus<span className="brand-light">connect</span></span></a><p>Making space for what’s next.</p><a href="#top">Back to top ↑</a></div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} CampusConnect</span><span>BUILT FOR BETTER CONNECTIONS</span></div></footer>
  </>;
}
