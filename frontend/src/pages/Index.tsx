import { useMemo } from "react";
import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing, Clock3, Filter, Globe2, Radar, Sparkles, Zap } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { HackathonCard } from "@/components/HackathonCard";
import { getDeadlineInfo, useHackathons } from "@/data/hackathons";
import SectionHeader from "@/components/ui/SectionHeader";
import FeatureCard from "@/components/ui/FeatureCard";

const features = [
  {
    icon: BellRing,
    title: "Refreshes continuously",
    desc: "Listings are refreshed from the crawler so discovery stays current and community-driven.",
  },
  {
    icon: Zap,
    title: "Deadline-first discovery",
    desc: "Sorting and visual cues bring closing opportunities into view without hiding the rest.",
  },
  {
    icon: Filter,
    title: "Filters that feel alive",
    desc: "Search, chips, and sorting stay lightweight while still feeling responsive and tactile.",
  },
];

const orbitRings = ["border-primary/25", "border-cyan-400/20", "border-violet-400/20"];

const Index = () => {
  const { data: hackathons = [], isLoading } = useHackathons();
  const preview = useMemo(
    () =>
      [...hackathons]
        .sort((a, b) => {
          const aDeadline = getDeadlineInfo(a).deadline?.getTime() ?? Number.POSITIVE_INFINITY;
          const bDeadline = getDeadlineInfo(b).deadline?.getTime() ?? Number.POSITIVE_INFINITY;
          return aDeadline - bDeadline;
        })
        .slice(0, 4),
    [hackathons],
  );
  const platformList = useMemo(() => Array.from(new Set(hackathons.map((h) => h.platform))).sort(), [hackathons]);
  const nextDeadlineLabel = useMemo(() => {
    if (!preview.length) return "TBA";
    const label = getDeadlineInfo(preview[0]).label;
    return label === "Deadline TBA" ? "TBA" : label.replace(/^Closes in\s+/, "");
  }, [preview]);

  return (
    <Layout>
      <section className="section-surface relative overflow-hidden pb-12 pt-10 md:pb-20 md:pt-14">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.28]" aria-hidden />
        <div className="absolute left-1/2 top-14 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="container relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_6px_hsl(var(--success)/0.12)] motion-safe:animate-pulse-soft" />
                Live - {hackathons.length} events indexed
              </div>

          <h1 className="font-display text-balance text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-primary">Hackathon radar</span>{" "}
            <span className="text-foreground">for the open-source internet</span>
            <span className="text-primary">.</span>
          </h1>

              <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground md:text-xl">
                HackRadar is an open-source, community-driven discovery engine that collects and normalizes hackathon listings so builders can spot the right opportunities faster.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="bg-primary-gradient shadow-glow transition-transform hover:-translate-y-0.5 hover:shadow-elevated">
                    <Link to="/hackathons">
                      Discover Hackathons <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-primary/20 bg-card/85 backdrop-blur transition-transform hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/8">
                    <Link to="/join">
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      Start Contributing
                    </Link>
                  </Button>
                </div>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Want to build with us? HackRadar welcomes engineers, designers, writers, and community contributors.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <StatPill icon={Radar} label="Sources" value={platformList.length > 0 ? `${platformList.length}+` : "Live"} />
                <StatPill icon={Clock3} label="Next closes" value={nextDeadlineLabel} />
                <StatPill icon={Globe2} label="Discovery mode" value="Open source" />
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
              <div className="absolute inset-0 rounded-[2rem] bg-radar-gradient blur-2xl opacity-80" aria-hidden />
              <div className="glass-surface-strong relative overflow-hidden rounded-[2rem] p-5 shadow-elevated">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_40%)]" aria-hidden />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">Opportunity field</div>
                    <div className="mt-1 text-sm text-muted-foreground">Cards orbit a live radar core and pulse as deadlines shift.</div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                    <span className="h-2 w-2 rounded-full bg-success motion-safe:animate-pulse-soft" />
                    Live data
                  </div>
                </div>

                <div className="relative mt-6 flex min-h-[28rem] items-center justify-center">
                  {orbitRings.map((ring, index) => (
                    <div
                      key={ring}
                      className={`absolute rounded-full border ${ring} ${index === 0 ? "h-52 w-52" : index === 1 ? "h-72 w-72" : "h-[22rem] w-[22rem]"} motion-safe:animate-sweep`}
                      style={{ animationDirection: index % 2 === 0 ? "normal" : "reverse" }}
                      aria-hidden
                    />
                  ))}

                  <div className="absolute h-28 w-28 rounded-full border border-primary/20 bg-card/90 shadow-elevated">
                    <div className="absolute inset-3 rounded-full bg-primary-gradient opacity-90" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center">
                        <div className="font-display text-xl font-bold tracking-tight text-foreground">RADAR</div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">HackRadar</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-full border border-primary/30 motion-safe:animate-pulse-soft" aria-hidden />
                  </div>

                  <OrbitCard
                    className="absolute left-4 top-10 animate-float"
                    accent="bg-cyan-400/15 text-cyan-700 border-cyan-200"
                    title={preview[0]?.title ?? "Open opportunity"}
                    meta={preview[0]?.platform ?? "Refreshing"}
                    tag={preview[0] ? getDeadlineInfo(preview[0]).label : "Closes soon"}
                  />
                  <OrbitCard
                    className="absolute right-4 top-16 animate-drift"
                    accent="bg-violet-400/15 text-violet-700 border-violet-200"
                    title={preview[1]?.title ?? "Build something new"}
                    meta={preview[1]?.organizer ?? "Community event"}
                    tag={preview[1] ? preview[1].mode : "Hybrid"}
                  />
                  <OrbitCard
                    className="absolute bottom-14 left-10 animate-float [animation-delay:1.2s]"
                    accent="bg-emerald-400/15 text-emerald-700 border-emerald-200"
                    title={preview[2]?.platform ?? "Source"}
                    meta={preview[2]?.country ?? "Global"}
                    tag={preview[2] ? `${preview[2].tags.slice(0, 1).join(" / ") || "Open"}` : "Open"}
                  />
                  <OrbitCard
                    className="absolute bottom-10 right-10 animate-drift [animation-delay:0.8s]"
                    accent="bg-rose-400/15 text-rose-700 border-rose-200"
                    title={preview[3]?.title ?? "Closing soon"}
                    meta={preview[3]?.organizer ?? "Deadline watch"}
                    tag={preview[3] ? getDeadlineInfo(preview[3]).label : "TBA"}
                  />

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border/70 bg-card/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground shadow-card">
                    Radar sweep active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-background/75 py-8 backdrop-blur">
        <div className="container">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Watching the field</p>
              <h2 className="mt-2 text-2xl font-display font-bold tracking-tight">Built for communities that like to move quickly.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {platformList.length > 0 ? (
                platformList.map((platform) => (
                  <span key={platform} className="rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-sm text-muted-foreground">
                    {platform}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No sources available yet</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-surface py-20">
        <div className="container relative">
          <SectionHeader
            eyebrow="Platform"
            title="Find your next hackathon"
            subtitle="A quick preview of open and upcoming hackathons discovered by HackRadar."
            center
          />

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <div key={feature.title} className={`animate-fade-in-up ${index === 1 ? "animate-delay-150" : index === 2 ? "animate-delay-300" : ""}`}>
                <FeatureCard icon={feature.icon} title={feature.title} desc={feature.desc} />
              </div>
            ))}
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-3 rounded-[1.5rem] border border-dashed border-border/70 bg-card/70 p-12 text-center text-muted-foreground">
                Loading hackathons...
              </div>
            ) : hackathons.length === 0 ? (
              <div className="col-span-3 rounded-[1.5rem] border border-dashed border-border/70 bg-card/70 p-12 text-center">
                No hackathons available right now.
              </div>
            ) : (
              hackathons.slice(0, 6).map((h, index) => (
                <div key={h.slug} className={index < 3 ? "animate-fade-in-up" : ""}>
                  <HackathonCard h={h} />
                </div>
              ))
            )}
          </div>

          <div className="mx-auto mt-10 text-center">
            <Button asChild size="sm" className="bg-primary-gradient shadow-glow transition-transform hover:-translate-y-0.5">
              <Link to="/hackathons">Explore all hackathons</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const StatPill = ({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) => (
  <div className="glass-surface rounded-3xl p-4 text-left">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </div>
    <div className="mt-2 font-display text-xl font-bold tracking-tight">{value}</div>
  </div>
);

const OrbitCard = ({
  className,
  accent,
  title,
  meta,
  tag,
}: {
  className: string;
  accent: string;
  title: string;
  meta: string;
  tag: string;
}) => (
  <div className={`glass-surface relative w-48 rounded-[1.25rem] border p-4 shadow-card ${className}`}>
    <div className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent}`}>
      {tag}
    </div>
    <div className="mt-3 text-sm font-semibold leading-5 text-foreground">{title}</div>
    <div className="mt-2 text-xs text-muted-foreground">{meta}</div>
  </div>
);

export default Index;
