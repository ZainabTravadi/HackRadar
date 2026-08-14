import type { ComponentType, SVGProps } from "react";

import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import SectionHeader from "@/components/ui/SectionHeader";
import { Globe, Settings, Search, Columns, Layers, Database, Server, Monitor, ArrowRight } from "lucide-react";

const ADAPTERS = [
  "devpost",
  "mlh",
  "devfolio",
  "unstop",
  "dorahacks",
  "taikai",
  "hackerearth",
  "hack2skill",
  "reskilll",
  "lablab",
  "ethglobal",
  "angelhack",
  "hackclub",
  "university",
  "eventbrite",
  "luma",
  "meetup",
  "github",
  "reddit",
  "discord",
  "telegram",
  "linkedin",
  "twitter",
  "facebook",
  "google",
  "manual",
];

const NODES = [
  { key: "external", title: "External Sources", icon: Globe, desc: "Hackathons discovered from supported public platforms.", label: "PUBLIC PLATFORMS" },
  { key: "adapters", title: "Source Adapters", icon: Settings, desc: "Platform-specific adapters normalize source HTML into events.", label: "ADAPTERS" },
  { key: "crawler", title: "Crawler", icon: Search, desc: "Discovery and extraction of event pages on a schedule.", label: "CRAWLER" },
  { key: "normalize", title: "Normalization", icon: Columns, desc: "Canonical event structure used across the system.", label: "NORMALIZER" },
  { key: "dedupe", title: "Deduplication", icon: Layers, desc: "Reduce duplicate discoveries into single records.", label: "DEDUP" },
  { key: "postgres", title: "PostgreSQL", icon: Database, desc: "Persistent storage for normalized event records.", label: "DATABASE" },
  { key: "api", title: "Public API", icon: Server, desc: "Read-only public endpoints serving the UI.", label: "API" },
  { key: "ui", title: "HackRadar UI", icon: Monitor, desc: "Discovery UI that presents the aggregated listings.", label: "UI" },
];

type IconType = ComponentType<SVGProps<SVGSVGElement>> | ComponentType<Record<string, unknown>>;

function NodeCard({ icon: Icon, title, desc, label }: { icon: IconType; title: string; desc: string; label?: string }) {
  return (
    <div className="hover-lift relative flex w-60 shrink-0 flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-card">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 via-transparent to-transparent" aria-hidden />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative mt-4 text-sm font-semibold tracking-tight">{title}</div>
      <div className="relative mt-2 text-sm leading-6 text-muted-foreground">{desc}</div>
      {label && <div className="relative mt-4 inline-flex w-fit rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.24em] text-muted-foreground">{label}</div>}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex shrink-0 items-center justify-center px-1" aria-hidden>
      <div className="flex items-center gap-2">
        <div className="h-px w-10 rounded-full bg-border/70" />
        <ArrowRight className="h-4 w-4 text-primary motion-safe:animate-pulse-soft" />
        <div className="h-px w-10 rounded-full bg-border/70" />
      </div>
    </div>
  );
}

export default function Transparency() {
  return (
    <Layout>
      <section className="section-surface relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.18]" aria-hidden />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="rounded-full border border-border/70 bg-card/90 px-3 py-1.5">
              Transparency
            </Badge>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Built in the open</h1>
            <p className="mt-3 text-muted-foreground">A transparent look at how HackRadar collects, normalizes, stores, and serves hackathon data.</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-6xl">
          <SectionHeader
            eyebrow="How it works"
            title="Pipeline visualization"
            subtitle="The architecture stays horizontally scrollable inside its own container, while the page itself remains width constrained."
            center
          />

          <div className="mt-8 rounded-[2rem] border border-border/70 bg-card/80 p-4 shadow-card">
            <div className="mb-3 text-center text-sm text-muted-foreground">Scroll to explore the pipeline</div>
            <div className="overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="min-w-max px-2">
                <div className="flex items-center gap-3">
                  {NODES.map((n, i) => (
                    <div key={n.key} className="flex items-center">
                      <NodeCard icon={n.icon} title={n.title} desc={n.desc} label={n.label} />
                      {i < NODES.length - 1 ? <Connector /> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-12 rounded-r-[2rem] bg-gradient-to-l from-background/90 to-transparent" aria-hidden />
            <div className="pointer-events-none absolute left-0 top-0 h-full w-12 rounded-l-[2rem] bg-gradient-to-r from-background/90 to-transparent" aria-hidden />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard title="Source attribution" desc="Official source pages remain the authority. Each listing links to the original event page." />
            <InfoCard title="Normalization" desc="Different platforms are mapped into a common structure so the UI can present consistent fields." />
            <InfoCard title="Deduplication" desc="Duplicate discoveries are consolidated into unique event records using heuristics." />
            <InfoCard title="Data storage" desc="Normalized records are stored in PostgreSQL and served via the public API." />
          </div>

          <div className="mt-12">
            <h3 className="text-lg font-semibold">Supported adapters</h3>
            <p className="mt-2 text-sm text-muted-foreground">Adapters present in the repository (examples):</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ADAPTERS.slice(0, 10).map((a) => (
                <div key={a} className="rounded-full border border-border/70 bg-card/85 px-3 py-1.5 text-sm text-muted-foreground">
                  {a}
                </div>
              ))}
              {ADAPTERS.length > 10 ? <div className="rounded-full border border-border/70 bg-card/85 px-3 py-1.5 text-sm text-muted-foreground">+{ADAPTERS.length - 10} more</div> : null}
            </div>
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground">
            View source:{" "}
            <a href="https://github.com/ZainabTravadi/List-Of-Hackathons" target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
              GitHub
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}

const InfoCard = ({ title, desc }: { title: string; desc: string }) => (
  <div className="hover-lift rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-card">
    <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">{title}</h4>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">{desc}</p>
  </div>
);
