import { Link } from "react-router-dom";
import { GitBranch, Handshake, ShieldCheck, Sparkles } from "lucide-react";

import { Layout } from "@/components/Layout";
import SectionHeader from "@/components/ui/SectionHeader";

const principles = [
  { title: "Open by default", desc: "Discussions and technical work should be public when practical." },
  { title: "Community-led", desc: "Decisions are shaped by contributors and the community." },
  { title: "Attribution first", desc: "Contributors deserve recognition for meaningful work." },
  { title: "Accessibility", desc: "We strive to be welcoming to people of different backgrounds and skills." },
  { title: "Responsible data", desc: "External data is attributed and handled responsibly." },
  { title: "Merit through contribution", desc: "Responsibility grows with sustained, meaningful contributions." },
];

const flow = [
  { title: "Idea", desc: "A contributor or maintainer spots a need." },
  { title: "Discussion", desc: "The community weighs tradeoffs and scope." },
  { title: "Proposal", desc: "A concrete plan or PR is drafted." },
  { title: "Review", desc: "Feedback, testing, and iteration happen in public." },
  { title: "Release", desc: "The change ships with attribution and context." },
];

const Governance = () => {
  return (
    <Layout>
      <section className="section-surface relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.18]" aria-hidden />
        <div className="container relative">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Governance"
              title="Built by the community. Shaped in the open."
              subtitle="Open principles that guide how HackRadar is developed and maintained."
              center={false}
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="glass-surface-strong rounded-[2rem] p-6 md:p-8">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Governance principles
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {principles.map((p) => (
                    <div key={p.title} className="hover-lift rounded-[1.5rem] border border-border/70 bg-card/85 p-5">
                      <h3 className="text-lg font-semibold tracking-tight">{p.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-surface rounded-[2rem] p-6 md:p-8">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  <GitBranch className="h-4 w-4 text-primary" />
                  Decision flow
                </div>
                <div className="mt-6 space-y-4">
                  {flow.map((item, index) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">{index + 1}</div>
                      <div className="flex-1 rounded-[1.25rem] border border-border/70 bg-background/75 px-4 py-3">
                        <div className="font-semibold tracking-tight">{item.title}</div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Handshake className="h-4 w-4 text-primary" />
                    How you can participate
                  </div>
                  <ol className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                    <li>Join the initiative via the Join page.</li>
                    <li>Find beginner-friendly work and improve docs or tests.</li>
                    <li>Submit PRs, request reviews, and participate in discussions.</li>
                    <li>Over time, sustained contributors may take on more responsibility.</li>
                  </ol>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/join" className="inline-flex items-center rounded-full bg-primary-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
                      Join
                    </Link>
                    <Link to="/docs" className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-semibold text-foreground">
                      Docs
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-[1.5rem] border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Community note
              </div>
              <p className="mt-2 leading-7">
                Use GitHub Issues, Discussions, and Pull Requests for transparent collaboration. See <Link to="/docs" className="text-primary underline-offset-4 hover:underline">Docs</Link> and <Link to="/roadmap" className="text-primary underline-offset-4 hover:underline">Roadmap</Link> for more context.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Governance;
