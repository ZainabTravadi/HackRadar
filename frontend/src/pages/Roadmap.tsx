import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, CircleDot, Compass, Sparkles } from "lucide-react";

const buckets = [
  {
    key: "Now",
    tone: "border-primary/20 bg-primary/10",
    icon: CircleDot,
    items: ["Discovery improvements and server-side filtering", "Community initiative: Join form and contributors list", "Documentation and transparency pages"],
  },
  {
    key: "Next",
    tone: "border-cyan-400/20 bg-cyan-400/10",
    icon: Sparkles,
    items: ["Public crawler health summaries", "API improvements and clearer docs", "Normalization and deduplication refinements"],
  },
  {
    key: "Exploring",
    tone: "border-violet-400/20 bg-violet-400/10",
    icon: Compass,
    items: ["SDKs and client libraries", "Contributor recognition features", "Improved search and recommendations"],
  },
  {
    key: "Completed",
    tone: "border-success/20 bg-success/10",
    icon: CheckCircle2,
    items: ["Hackathon discovery UI and filters", "Server-side filtering and normalized API", "Community Join flow (Phase 3)"],
  },
];

export default function Roadmap() {
  return (
    <Layout>
      <section className="section-surface relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.18]" aria-hidden />
        <div className="container relative">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Roadmap</h2>
                <p className="mt-4 text-muted-foreground">A transparent view of priorities - what we’re working on, planning, and ideas we’re exploring.</p>
              </div>
              <Button variant="outline" asChild className="rounded-full border-border/70 bg-card/85">
                <a href="/join">
                  Contribute <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">Roadmap buckets are ordered by priority. Use the Contribute button to join the initiative or propose improvements to any item.</p>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
              {buckets.map((bucket, index) => (
                <div key={bucket.key} className={`hover-lift rounded-[1.5rem] border p-6 shadow-card ${bucket.tone}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <bucket.icon className="h-4 w-4 text-foreground" />
                      <h3 className="font-display text-2xl font-bold tracking-tight">{bucket.key}</h3>
                    </div>
                    <span className="rounded-full border border-border/70 bg-card/85 px-2.5 py-1 text-xs font-semibold text-muted-foreground">{bucket.items.length}</span>
                  </div>

                  <ul className="mt-5 space-y-3">
                    {bucket.items.map((it) => (
                      <li key={it} className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm leading-6 text-muted-foreground">
                        {it}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Priority lane {index + 1}</span>
                    <button className="font-medium text-primary hover:underline" onClick={() => alert(`Want to contribute to: ${bucket.key}`)}>
                      Discuss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
