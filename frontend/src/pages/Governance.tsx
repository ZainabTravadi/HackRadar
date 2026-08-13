import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import SectionHeader from '@/components/ui/SectionHeader';

const principles = [
  { title: 'Open by default', desc: 'Discussions and technical work should be public when practical.' },
  { title: 'Community-led', desc: 'Decisions are shaped by contributors and the community.' },
  { title: 'Attribution first', desc: 'Contributors deserve recognition for meaningful work.' },
  { title: 'Accessibility', desc: 'We strive to be welcoming to people of different backgrounds and skills.' },
  { title: 'Responsible data', desc: 'External data is attributed and handled responsibly.' },
  { title: 'Merit through contribution', desc: 'Responsibility grows with sustained, meaningful contributions.' },
];

const Governance = () => {
  return (
    <Layout>
      <div className="container py-16">
        <SectionHeader title="Built by the community. Shaped in the open." subtitle="Open principles that guide how HackRadar is developed and maintained." />

        <h2 className="mt-8 text-xl font-semibold">Governance Principles</h2>
        <section className="mt-4 grid gap-6 md:grid-cols-2">
          {principles.map((p) => (
            <div key={p.title} className="rounded-2xl border p-4">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Decision flow</h2>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {['Idea','Discussion','Proposal','Feedback','Implementation','Review','Release'].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="rounded-full bg-card border px-3 py-1 text-sm font-medium">{s}</div>
                {i < 6 && (
                  <div className="flex items-center" aria-hidden>
                    <div className="h-1 w-8 rounded-full bg-border/50" />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 text-muted-foreground opacity-80">
                      <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">Use GitHub Issues, Discussions, and Pull Requests for transparent collaboration. See <Link to="/docs">Docs</Link> and <Link to="/roadmap">Roadmap</Link> for more context.</p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">How you can participate</h2>
          <ol className="mt-4 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Join the initiative via the <Link to="/join">Join</Link> page.</li>
            <li>Find beginner-friendly work (issues labelled in GitHub) and improve docs or tests.</li>
            <li>Submit PRs, request reviews, and participate in discussions.</li>
            <li>Over time, consistent contributors may take on review or maintainer responsibilities.</li>
          </ol>
        </section>
      </div>
    </Layout>
  );
};

export default Governance;
