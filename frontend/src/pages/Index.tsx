import { Link } from "react-router-dom";
import { ArrowRight, Bell, Filter, Zap, Github } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { HackathonCard } from "@/components/HackathonCard";
import { useHackathons } from "@/data/hackathons";
import { useMemo } from "react";

const features = [
  {
    icon: Bell,
    title: "Real-time updates",
    desc: "We re-crawl every 6 hours. New listings appear before they trend on Twitter.",
  },
  {
    icon: Zap,
    title: "Deadline-first sorting",
    desc: "Closing soonest is the default. Never miss a hackathon because of a buried deadline again.",
  },
  {
    icon: Filter,
    title: "Smart filtering",
    desc: "Filter by mode, theme, country, and prize tier. Save the views you actually use.",
  },
];

const Index = () => {
  const { data: hackathons = [], isLoading } = useHackathons();
  const preview = useMemo(() => [...hackathons].sort((a, b) =>
    new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime()
  ).slice(0, 3), [hackathons]);
  const platformList = useMemo(() => Array.from(new Set(hackathons.map((h) => h.platform))).sort(), [hackathons]);
  const nextDeadlineDays = useMemo(() => {
    if (!preview.length) return "—";
    const first = preview[0];
    const days = Math.ceil((new Date(first.registrationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(days, 0);
  }, [preview]);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live · {hackathons.length} hackathons indexed
            </div>

            <h1 className="text-balance text-5xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Find Hackathons
              <br />
              Before They <span className="font-serif-display italic text-primary">Close</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              Live hackathons from the backend sources, refreshed from the current crawl results.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-primary-gradient shadow-glow hover:opacity-95">
                <Link to="/hackathons">
                  Explore Hackathons <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-card/70 backdrop-blur">
                <Link to="/api">View API</Link>
              </Button>
            </div>
          </div>

          {/* Floating accent cards */}
          <div className="pointer-events-none absolute left-4 top-32 hidden rotate-[-8deg] rounded-2xl border border-border bg-card p-3 shadow-elevated lg:block">
            <div className="text-xs text-muted-foreground">Closing in</div>
            <div className="text-2xl font-semibold text-destructive">{nextDeadlineDays}d</div>
          </div>
          <div className="pointer-events-none absolute right-6 top-48 hidden rotate-[6deg] rounded-2xl border border-border bg-card p-3 shadow-elevated lg:block">
            <div className="text-xs text-muted-foreground">Total prizes</div>
            <div className="text-2xl font-semibold text-foreground">{platformList.length} sources</div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-border/60 bg-background py-10">
        <div className="container">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Aggregating from top platforms
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {platformList.length > 0 ? platformList.map((p) => (
              <span key={p} className="text-base font-semibold text-muted-foreground/70 hover:text-foreground transition-smooth">
                {p}
              </span>
            )) : <span className="text-base font-semibold text-muted-foreground/70">No sources available yet</span>}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              One radar for every <span className="font-serif-display italic">hackathon</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built for developers who want signal, not noise.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card-gradient p-7 shadow-card">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="bg-soft-gradient py-24">
        <div className="container">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Closing soonest
              </h2>
              <p className="mt-2 text-muted-foreground">A live preview of the radar.</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link to="/hackathons">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Loading live hackathons...
            </div>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {preview.map((h) => <HackathonCard key={h.slug} h={h} />)}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Button asChild variant="outline">
              <Link to="/hackathons">View all hackathons</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-primary-gradient p-12 text-center shadow-elevated">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
              Ship more. Miss fewer deadlines.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
              Free, open, and built by hackers for hackers.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link to="/hackathons">Explore Hackathons</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <a href="https://github.com"><Github className="mr-1.5 h-4 w-4" /> Star on GitHub</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
