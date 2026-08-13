import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from '@/components/ui/button';
import SectionHeader from '@/components/ui/SectionHeader';

const cards = [
  { title: 'Opportunity discovery', emoji: '🔍', desc: 'Make hackathons and events easier to find across fragmented platforms.' },
  { title: 'Accessibility', emoji: '♿️', desc: 'Reduce effort to discover opportunities for people with different needs and backgrounds.' },
  { title: 'Open data', emoji: '📡', desc: 'Expose normalized discovery information through an accessible API where appropriate.' },
  { title: 'Community', emoji: '🤝', desc: 'Create practical opportunities for developers, designers, data contributors, and organizers to participate.' },
];

const stats = [
  { label: 'Sources', value: '—' },
  { label: 'Normalized events', value: '—' },
  { label: 'Active contributors', value: '—' },
];

const Impact = () => (
  <Layout>
    <div className="container py-16">
      <div className="max-w-5xl">
        <SectionHeader title="What HackRadar aims to improve" subtitle="Goals focused on discovery, accessibility, and community — not claimed achievements." center={false} />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <div key={c.title} className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">{c.emoji}</div>
              <div>
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-gradient-to-r from-accent/5 to-transparent p-4 text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Report data issues</h3>
              <p className="mt-1 text-sm text-muted-foreground">If you find incorrect or stale event information, use the "Report incorrect information" link on an event's detail page — it opens a GitHub issue pre-filled with source context. Organizers: official sources remain authoritative; contact us via GitHub issues for corrections.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => window.location.assign('/transparency')}>Transparency</Button>
              <Button onClick={() => window.location.assign('/join')}>Contribute</Button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Learn more</h2>
          <p className="mt-2 text-sm text-muted-foreground">See our <Link to="/transparency">Transparency</Link> and <Link to="/governance">Governance</Link> pages for details about how HackRadar works.</p>
        </div>
      </div>
    </div>
  </Layout>
);

export default Impact;
