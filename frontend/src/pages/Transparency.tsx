import { Layout } from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import SectionHeader from '@/components/ui/SectionHeader';
import { Globe, Settings, Search, Columns, Layers, Database, Server, Monitor } from 'lucide-react';

const ADAPTERS = [
  'devpost', 'mlh', 'devfolio', 'unstop', 'dorahacks', 'taikai', 'hackerearth', 'hack2skill', 'reskilll', 'lablab', 'ethglobal', 'angelhack', 'hackclub', 'university', 'eventbrite', 'luma', 'meetup', 'github', 'reddit', 'discord', 'telegram', 'linkedin', 'twitter', 'facebook', 'google', 'manual'
];

const NODES = [
  { key: 'external', title: 'External Sources', icon: Globe, desc: 'Hackathons discovered from supported public platforms.', label: 'PUBLIC PLATFORMS' },
  { key: 'adapters', title: 'Source Adapters', icon: Settings, desc: 'Platform-specific adapters normalize source HTML into events.', label: 'ADAPTERS' },
  { key: 'crawler', title: 'Crawler', icon: Search, desc: 'Discovery and extraction of event pages on a schedule.', label: 'CRAWLER' },
  { key: 'normalize', title: 'Normalization', icon: Columns, desc: 'Canonical event structure used across the system.', label: 'NORMALIZER' },
  { key: 'dedupe', title: 'Deduplication', icon: Layers, desc: 'Reduce duplicate discoveries into single records.', label: 'DEDUP' },
  { key: 'postgres', title: 'PostgreSQL', icon: Database, desc: 'Persistent storage for normalized event records.', label: 'DATABASE' },
  { key: 'api', title: 'Public API', icon: Server, desc: 'Read-only public endpoints serving the UI.', label: 'API' },
  { key: 'ui', title: 'HackRadar UI', icon: Monitor, desc: 'Discovery UI that presents the aggregated listings.', label: 'UI' },
];

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ComponentType<Record<string, unknown>>;

function NodeCard({ icon: Icon, title, desc, label }: { icon: IconType; title: string; desc: string; label?: string }) {
  return (
    <div className="group relative flex w-56 flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center shadow-card hover:shadow-elevated transition-transform motion-safe:transform-gpu motion-safe:hover:-translate-y-1">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
      {label && <div className="mt-2 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">{label}</div>}
    </div>
  );
}

function Connector({ horizontal = true }: { horizontal?: boolean }) {
  return (
    <div className={horizontal ? 'flex-1 flex items-center justify-center' : 'h-6 w-px'} aria-hidden>
      {horizontal ? (
        <div className="relative w-full max-w-md">
          <div className="h-1 w-full rounded-full bg-border/40"></div>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rotate-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground opacity-80">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="flex h-12 items-center justify-center">
          <div className="h-full w-px bg-border/40" />
        </div>
      )}
    </div>
  );
}

export default function Transparency() {
  return (
    <Layout>
      <section className="bg-hero-gradient py-16">
        <div className="container max-w-3xl text-center">
          <Badge variant="secondary" className="rounded-full">Transparency</Badge>
          <h1 className="mt-4 text-4xl font-semibold">Built in the open</h1>
          <p className="mt-3 text-muted-foreground">A transparent look at how HackRadar collects, normalizes, stores, and serves hackathon data.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-6xl">
          <SectionHeader title="How HackRadar works" subtitle="A transparent pipeline from source adapters to the public API and the discovery UI." center={true} />

          {/* Pipeline visual */}
          <div className="mt-8">
            <div className="w-full max-w-6xl min-w-0">
              {/* make only the pipeline horizontally scrollable, keep page width fixed */}
              <div className="relative overflow-x-auto py-4">
                {/* content width can exceed viewport */}
                <div className="min-w-max">
                  <div className="flex items-center gap-6">
                    {NODES.map((n, i) => (
                      <div key={n.key} className="flex flex-col items-center flex-none">
                        <NodeCard icon={n.icon} title={n.title} desc={n.desc} label={n.label} />

                        {i < NODES.length - 1 && (
                          <div className="mt-4 lg:mt-0">
                            <Connector horizontal />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* subtle right-edge fade to indicate more content */}
                <div className="pointer-events-none absolute right-0 top-0 h-full w-12">
                  <div className="h-full w-full bg-gradient-to-l from-white/0 to-background/80 dark:to-background/80" />
                </div>
              </div>
            </div>
          </div>

          {/* Small explanatory cards */}
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="text-sm font-semibold">Source attribution</h4>
              <p className="mt-2 text-sm text-muted-foreground">Official source pages remain the authority. Each listing links to the original event page.</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="text-sm font-semibold">Normalization</h4>
              <p className="mt-2 text-sm text-muted-foreground">Different platforms are mapped into a common structure so the UI can present consistent fields.</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="text-sm font-semibold">Deduplication</h4>
              <p className="mt-2 text-sm text-muted-foreground">Duplicate discoveries are consolidated into unique event records using heuristics.</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="text-sm font-semibold">Data storage</h4>
              <p className="mt-2 text-sm text-muted-foreground">Normalized records are stored in PostgreSQL and served via the public API.</p>
            </div>
          </div>

          {/* Adapter chips */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold">Source adapters present in this repository</h3>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-semibold">Supported adapters</h3>
            <p className="mt-2 text-sm text-muted-foreground">Adapters present in the repository (examples):</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ADAPTERS.slice(0, 8).map((a) => (
                <div key={a} className="rounded-md border px-3 py-1 text-sm">{a}</div>
              ))}
              {ADAPTERS.length > 8 && <div className="rounded-md border px-3 py-1 text-sm">+{ADAPTERS.length - 8} more</div>}
            </div>
          </div>

          <div className="mt-8">
            <div className="rounded-2xl border p-6 text-sm">View source: <a href="https://github.com/ZainabTravadi/List-Of-Hackathons" target="_blank" rel="noreferrer" className="text-primary underline">GitHub</a></div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
