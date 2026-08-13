import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, Filter, Zap } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { HackathonCard } from "@/components/HackathonCard";
import { getDeadlineInfo, useHackathons } from "@/data/hackathons";
import SectionHeader from "@/components/ui/SectionHeader";
import GradientText from "@/components/ui/GradientText";
import FeatureCard from "@/components/ui/FeatureCard";

const features = [
  {
    icon: Bell,
    title: "Regularly refreshed",
    desc: "Listings are refreshed from our crawler so discovery stays up to date.",
  },
  {
    icon: Zap,
    title: "Deadline-first sorting",
    desc: "Default sorting surfaces hackathons closing soon so you can act fast.",
  },
  {
    icon: Filter,
    title: "Flexible filters",
    desc: "Filter by mode, theme, country, and more using the discovery tools.",
  },
];

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
        .slice(0, 3),
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
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container relative py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live · {hackathons.length} events indexed
            </div>

            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              <GradientText>Every hackathon.</GradientText> One open map for discovery.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
              HackRadar is an open-source, community-driven project that collects and normalizes hackathon listings so you can find the right opportunities faster.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-primary-gradient shadow-glow hover:opacity-95">
                <Link to="/hackathons">
                  Discover Hackathons <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-card/70 backdrop-blur">
                <a href="https://github.com/ZainabTravadi/List-Of-Hackathons" target="_blank" rel="noreferrer">
                  Join the Initiative
                </a>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-3 gap-4 lg:gap-6">
            {preview.map((h, i) => (
              <div key={h.slug} className={`transform ${i === 1 ? 'scale-105' : i === 0 ? '-translate-y-2' : 'translate-y-2'}`}>
                <HackathonCard h={h} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-background py-10">
        <div className="container">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Aggregating from top platforms
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {platformList.length > 0 ? (
              platformList.map((platform) => (
                <span key={platform} className="text-base font-semibold text-muted-foreground/70 transition-smooth hover:text-foreground">
                  {platform}
                </span>
              ))
            ) : (
              <span className="text-base font-semibold text-muted-foreground/70">No sources available yet</span>
            )}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Find your next hackathon
            </h2>
            <p className="mt-4 text-muted-foreground">
              A quick preview of open and upcoming hackathons discovered by HackRadar.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-border bg-card-gradient p-7 shadow-card">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-3 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                Loading hackathons...
              </div>
            ) : hackathons.length === 0 ? (
              <div className="col-span-3 rounded-2xl border border-dashed border-border p-12 text-center">
                No hackathons available right now.
              </div>
            ) : (
              hackathons.slice(0, 6).map((h) => <HackathonCard key={h.slug} h={h} />)
            )}
          </div>

          <div className="mx-auto mt-8 text-center">
            <Button asChild size="sm" className="bg-primary-gradient">
              <Link to="/hackathons">Explore all hackathons</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
