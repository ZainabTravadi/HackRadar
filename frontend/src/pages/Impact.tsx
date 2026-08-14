import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChartColumnIncreasing, HeartHandshake, Radar, ShieldAlert, Users2 } from "lucide-react";

import { Layout } from "@/components/Layout";
import SectionHeader from "@/components/ui/SectionHeader";

const cards = [
  {
    title: "Opportunity discovery",
    icon: Radar,
    desc: "Make hackathons and events easier to find across fragmented platforms.",
  },
  {
    title: "Accessibility",
    icon: ShieldAlert,
    desc: "Reduce effort to discover opportunities for people with different needs and backgrounds.",
  },
  {
    title: "Open data",
    icon: ChartColumnIncreasing,
    desc: "Expose normalized discovery information through an accessible API where appropriate.",
  },
  {
    title: "Community",
    icon: Users2,
    desc: "Create practical opportunities for developers, designers, data contributors, and organizers to participate.",
  },
];

const stats = [
  { label: "Sources", value: "-" },
  { label: "Normalized events", value: "-" },
  { label: "Active contributors", value: "-" },
];

const Impact = () => (
  <Layout>
    <section className="section-surface relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
      <div className="absolute inset-0 radar-grid opacity-[0.18]" aria-hidden />
      <div className="container relative">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title="What HackRadar aims to improve" subtitle="Goals focused on discovery, accessibility, and community - not claimed achievements." center={false} />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {cards.map((c) => (
              <div key={c.title} className="hover-lift flex gap-4 rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{c.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 text-center shadow-card">
                <div className="font-display text-3xl font-bold tracking-tight">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-border/70 bg-card/80 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  Report data issues
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  If you find incorrect or stale event information, use the "Report incorrect information" link on an event's detail page - it opens a GitHub issue pre-filled with source context. Organizers: official sources remain authoritative; contact us via GitHub issues for corrections.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-full border-border/70" asChild>
                  <Link to="/transparency">Transparency</Link>
                </Button>
                <Button className="rounded-full bg-primary-gradient shadow-glow" asChild>
                  <Link to="/join">Contribute</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold">Learn more</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              See our <Link to="/transparency" className="text-primary underline-offset-4 hover:underline">Transparency</Link> and <Link to="/governance" className="text-primary underline-offset-4 hover:underline">Governance</Link> pages for details about how HackRadar works.
            </p>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export default Impact;
