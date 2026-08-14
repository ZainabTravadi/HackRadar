import { Link } from "react-router-dom";
import { BadgeCheck, BookOpen, Layers3, Radar, Sparkles, Users2 } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/ui/SectionHeader";
import FeatureCard from "@/components/ui/FeatureCard";

const sections = [
  {
    title: "The problem",
    icon: Radar,
    desc: "Hackathons are scattered across platforms, university pages, and community posts, which makes discovery noisy and time-consuming.",
  },
  {
    title: "The idea",
    icon: Sparkles,
    desc: "HackRadar brings those signals into one open, community-shaped discovery engine that feels more like a radar sweep than a spreadsheet.",
  },
  {
    title: "How it works",
    icon: Layers3,
    desc: "Adapters collect public listings, normalize them into a shared shape, and publish them through a consistent UI and API.",
  },
  {
    title: "Why open source",
    icon: BookOpen,
    desc: "The project stays transparent, remixable, and easier to improve because contributors can inspect, test, and refine the workflow.",
  },
  {
    title: "Who can contribute",
    icon: Users2,
    desc: "Developers, designers, writers, testers, accessibility advocates, and organizers can all help improve the radar.",
  },
  {
    title: "Built to stay honest",
    icon: BadgeCheck,
    desc: "HackRadar treats source attribution, validation, and public event pages as part of the product, not afterthoughts.",
  },
];

export default function About() {
  return (
    <Layout>
      <section className="section-surface relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.18]" aria-hidden />
        <div className="container relative">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="About HackRadar"
              title="Making hackathon discovery feel alive."
              subtitle="A visual story about the problem, the system, and the people who help keep the radar sharp."
              center={false}
            />

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sections.map((item) => (
                <FeatureCard key={item.title} icon={item.icon} title={item.title} desc={item.desc} />
              ))}
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="glass-surface-strong rounded-[2rem] p-6 md:p-8">
                <h2 className="font-display text-3xl font-bold tracking-tight">How HackRadar works</h2>
                <div className="mt-6 grid gap-3">
                  {[
                    "Sources: public event pages and community listings",
                    "Adapters: platform-specific collection and parsing",
                    "Normalization: consistent event fields and metadata",
                    "Discovery: search, filters, detail pages, and shareable routes",
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-4 rounded-3xl border border-border/70 bg-card/80 p-4">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">{index + 1}</div>
                      <p className="text-sm leading-7 text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-surface rounded-[2rem] p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold tracking-tight">Open source, but still structured</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  HackRadar is designed so contributors can focus on one layer at a time. That makes the project easier to maintain without flattening it into a boring dashboard.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Begin with docs, tests, or UI polish.",
                    "Contribute adapters or normalization improvements.",
                    "Keep source attribution and validation intact.",
                    "Use the Join page to introduce yourself to the community.",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="rounded-full bg-primary-gradient shadow-glow">
                    <a href="https://github.com/ZainabTravadi/List-Of-Hackathons" target="_blank" rel="noreferrer">
                      View on GitHub
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-border/70">
                    <Link to="/hackathons">Explore Hackathons</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
