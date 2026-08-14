import { ExternalLink, Github, Users2 } from "lucide-react";

import { Layout } from "@/components/Layout";
import { FellowshipBadge } from "@/components/community/FellowshipBadge";
import SectionHeader from "@/components/ui/SectionHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useContributors } from "@/data/community";

function initials(value: string): string {
  return (
    value
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || value.slice(0, 2).toUpperCase()
  );
}

function ContributorsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-56 rounded-[1.5rem]" />
      ))}
    </div>
  );
}

export default function Contributors() {
  const { data, isLoading, isError, refetch } = useContributors();
  const contributors = data ?? [];
  const fellowshipCount = contributors.filter((contributor) => contributor.isFellowshipMember).length;

  return (
    <Layout>
      <section className="section-surface relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.18]" aria-hidden />
        <div className="container relative">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Community"
              title="The HackRadar contributor directory"
              subtitle="This page includes every real GitHub contributor to the repository, whether or not they are part of the HackRadar Fellowship."
            />

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="gap-1.5 rounded-full border-border/70 bg-background/80 px-3 py-1.5">
                <Users2 className="h-3.5 w-3.5" />
                All contributors
              </Badge>
              <Badge variant="outline" className="gap-1.5 rounded-full border-border/70 bg-background/80 px-3 py-1.5">
                <Github className="h-3.5 w-3.5" />
                Real GitHub data where available
              </Badge>
              <Badge variant="outline" className="gap-1.5 rounded-full border-border/70 bg-background/80 px-3 py-1.5">
                <Users2 className="h-3.5 w-3.5" />
                {fellowshipCount} Fellowship member{fellowshipCount === 1 ? "" : "s"}
              </Badge>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <Card className="rounded-[1.75rem] border-border/70 bg-card/90 shadow-card">
                <CardContent className="p-6">
                  {isLoading ? (
                    <ContributorsSkeleton />
                  ) : isError ? (
                    <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
                      The contributor directory could not be loaded right now.
                      <div className="mt-4">
                        <Button variant="outline" onClick={() => refetch()} className="rounded-full">
                          Try again
                        </Button>
                      </div>
                    </div>
                  ) : contributors.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/70 p-8 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
                        <Users2 className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">No contributors found yet</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        As soon as people contribute to the repository, their GitHub profile will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {contributors.map((contributor) => (
                        <a
                          key={contributor.githubUsername}
                          href={contributor.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group rounded-[1.5rem] border border-border/70 bg-background/80 p-4 shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-background/95"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                              <AvatarImage src={contributor.avatarUrl} alt={contributor.displayName} />
                              <AvatarFallback>{initials(contributor.githubUsername)}</AvatarFallback>
                            </Avatar>
                            <ExternalLink className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </div>
                          <div className="mt-4 min-w-0">
                            <div className="truncate text-base font-semibold tracking-tight">@{contributor.githubUsername}</div>
                            <div className="truncate text-sm text-muted-foreground">{contributor.displayName}</div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="outline" className="rounded-full border-border/70 bg-card/85 text-[11px] uppercase tracking-[0.18em]">
                              HackRadar Contributor
                            </Badge>
                            {contributor.isFellowshipMember ? <FellowshipBadge /> : null}
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-2xl border border-border/70 bg-card/80 p-3">
                              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">GitHub contribs</div>
                              <div className="mt-1 font-semibold">{contributor.contributions}</div>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-card/80 p-3">
                              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Merged PRs</div>
                              <div className="mt-1 font-semibold">{contributor.mergedPrs}</div>
                            </div>
                          </div>
                          {contributor.contributionAreas.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {contributor.contributionAreas.slice(0, 3).map((area) => (
                                <Badge key={area} variant="outline" className="rounded-full border-border/70 bg-background/80 text-[11px] uppercase tracking-[0.16em]">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="rounded-[1.75rem] border-border/70 bg-card/90 shadow-card">
                  <CardContent className="space-y-4 p-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Community overview
                    </div>
                    <div className="text-3xl font-bold tracking-tight">{contributors.length}</div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      This directory is broader than the Fellowship leaderboard. It includes every contributor we can safely surface from GitHub data.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-border/70 bg-card/90 shadow-card">
                  <CardContent className="space-y-4 p-6">
                    <div className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Fellowship visibility</div>
                    <div className="text-3xl font-bold tracking-tight">{fellowshipCount}</div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      Fellowship members are highlighted with a dedicated badge, but they appear alongside every other contributor on this page.
                    </p>
                    <div className="rounded-2xl border border-border/70 bg-primary/5 p-4 text-sm leading-7 text-muted-foreground">
                      Membership on the leaderboard comes from the initiative application database. This page does not require Fellowship participation.
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-border/70 bg-card/90 shadow-card">
                  <CardContent className="p-6">
                    <div className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Want to contribute?</div>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Find a contribution issue, pick a track, and open a PR. Fellowship members will appear on the leaderboard after merged work is recorded.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button asChild className="rounded-full bg-primary-gradient shadow-glow">
                        <a href="/join">Join the initiative</a>
                      </Button>
                      <Button asChild variant="outline" className="rounded-full border-border/70">
                        <a href="/leaderboard">View leaderboard</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
