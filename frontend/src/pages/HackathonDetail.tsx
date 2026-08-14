import type { ComponentType, SVGProps } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock3, ExternalLink, MapPin, MessageSquareWarning, Radar, Users } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, getDeadlineInfo, getStatus, useHackathon } from "@/data/hackathons";

const HackathonDetail = () => {
  const { slug } = useParams();
  const { data: h, isLoading, error } = useHackathon(slug);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-2xl font-bold">Loading hackathon...</h1>
        </div>
      </Layout>
    );
  }

  if (error || !h) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-2xl font-bold">Hackathon not found</h1>
          <Button asChild variant="link">
            <Link to="/hackathons">Back to all hackathons</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const deadline = getDeadlineInfo(h);
  const status = getStatus(h);
  const sourceAccent =
    h.platform === "Devpost"
      ? "from-cyan-400/20 via-primary/10 to-transparent"
      : h.platform === "MLH"
        ? "from-rose-400/20 via-primary/10 to-transparent"
        : h.platform === "Devfolio"
          ? "from-violet-400/20 via-primary/10 to-transparent"
          : "from-primary/20 via-secondary/30 to-transparent";

  return (
    <Layout>
      <section className="section-surface relative overflow-hidden pb-10 pt-8 md:pb-14">
        <div className={`absolute inset-0 bg-gradient-to-br ${sourceAccent}`} aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.18]" aria-hidden />
        <div className="container relative">
          <Link to="/hackathons" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All hackathons
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="glass-surface-strong overflow-hidden rounded-[2rem] p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="rounded-full border border-border/70 bg-card/90 px-3 py-1.5">
                  <Radar className="mr-1 h-3.5 w-3.5" />
                  {h.platform}
                </Badge>
                <StatusBadge variant={status === "Closing Soon" ? "closing" : status === "Open" ? "open" : status === "Ended" ? "ended" : "default"}>
                  {deadline.label}
                </StatusBadge>
                <span className="rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Source-first
                </span>
              </div>

              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">{h.title}</h1>

              <p className="mt-4 max-w-3xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">{h.description}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetaCard icon={Calendar} label="Registration" value={formatDate(h.registrationDeadline)} />
                <MetaCard icon={Clock3} label="Submission" value={formatDate(h.submissionDeadline)} />
                <MetaCard icon={MapPin} label="Mode" value={[h.mode, h.country].filter(Boolean).join(" / ") || "Unknown"} />
                <MetaCard icon={Users} label="Organizer" value={h.organizer} />
              </div>
            </div>

            <aside className="space-y-4">
              <div className="glass-surface-strong overflow-hidden rounded-[2rem] p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Action area</div>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Visit the official event page.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  HackRadar keeps the discovery surface open, but the official source remains authoritative for registration, rules, and submission details.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button asChild size="lg" className="bg-primary-gradient shadow-glow transition-transform hover:-translate-y-0.5">
                    <a href={h.url} target="_blank" rel="noopener noreferrer">
                      Visit Official Site <ExternalLink className="ml-1.5 h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="border-border/70">
                    <Link to="/hackathons">Browse more</Link>
                  </Button>
                </div>
              </div>

              <div className="glass-surface rounded-[2rem] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Last updated</div>
                <div className="mt-2 text-sm font-medium text-foreground">
                  {h.updatedHoursAgo}h ago - Source: {h.platform}
                </div>
              </div>

              <div className="glass-surface rounded-[2rem] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Tags</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {h.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full border border-border/70 bg-secondary/70 px-3 py-1.5 text-sm font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="glass-surface rounded-[2rem] p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  <MessageSquareWarning className="h-4 w-4" />
                  Report issue
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Found incorrect information? Open a prefilled GitHub issue with source context so the data can be corrected quickly.
                </p>
                <div className="mt-4">
                  <Button asChild size="sm" variant="outline" className="rounded-full border-border/70">
                    <a
                      href={`https://github.com/ZainabTravadi/HackRadar/issues/new?title=${encodeURIComponent(`[Data Issue] ${h.title}`)}&body=${encodeURIComponent(
                        `I found a possible data issue with the following listing:\n\n- Title: ${h.title}\n- Source: ${h.platform}\n- Source URL: ${h.url}\n- Site slug: ${h.slug || ""}\n\nPlease describe the problem and any supporting links or screenshots here.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Report incorrect information
                    </a>
                  </Button>
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.42fr]">
            <div className="glass-surface rounded-[2rem] p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold tracking-tight">Description</h2>
              <div className="prose prose-slate mt-4 max-w-none text-muted-foreground">
                <p>{h.description}</p>
                <p>
                  Use the official event link above for the canonical source of truth. HackRadar mirrors the public listing so builders can compare opportunities quickly without losing attribution.
                </p>
              </div>
            </div>

            <div className="glass-surface rounded-[2rem] p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold tracking-tight">Quick facts</h2>
              <div className="mt-4 space-y-3">
                <MiniFact label="Deadline" value={deadline.label} />
                <MiniFact label="Prize pool" value={h.prize ?? "Not specified"} />
                <MiniFact label="Status" value={status} />
                <MiniFact label="Source platform" value={h.platform} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const MetaCard = ({ icon: Icon, label, value }: { icon: ComponentType<SVGProps<SVGSVGElement>>; label: string; value: string }) => (
  <div className="rounded-3xl border border-border/70 bg-card/85 p-4 shadow-card">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </div>
    <div className="mt-2 text-sm font-semibold leading-6 text-foreground">{value}</div>
  </div>
);

const MiniFact = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
  </div>
);

export default HackathonDetail;
