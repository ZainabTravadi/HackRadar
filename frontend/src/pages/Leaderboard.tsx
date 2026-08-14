import { Crown, Medal, Sparkles, TrendingUp, Users2 } from "lucide-react";

import { Layout } from "@/components/Layout";
import { FellowshipBadge } from "@/components/community/FellowshipBadge";
import SectionHeader from "@/components/ui/SectionHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeaderboard, type FellowshipLeaderboardEntry } from "@/data/community";
import { Button } from "@/components/ui/button";

function initials(value: string): string {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || value.slice(0, 2).toUpperCase();
}

function dominantDifficulty(entry: FellowshipLeaderboardEntry): { label: string; count: number } {
  const levels = [
    { label: "Expert", count: entry.expert },
    { label: "Hard", count: entry.hard },
    { label: "Medium", count: entry.medium },
    { label: "Easy", count: entry.easy },
  ];

  return levels.reduce((best, current) => (current.count > best.count ? current : best));
}

function difficultySummary(entry: FellowshipLeaderboardEntry): string {
  return [`${entry.easy} easy`, `${entry.medium} medium`, `${entry.hard} hard`, `${entry.expert} expert`].join(" · ");
}

function LeaderboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Skeleton className="h-[280px] rounded-[1.75rem]" />
      <Skeleton className="h-[280px] rounded-[1.75rem]" />
    </div>
  );
}

export default function Leaderboard() {
  const { data, isLoading, isError, refetch } = useLeaderboard();
  const entries = data ?? [];
  const podium = entries.slice(0, 3);
  const others = entries.slice(3);

  return (
    <Layout>
      <section className="section-surface relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.18]" aria-hidden />
        <div className="container relative">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="HackRadar Fellowship"
              title="Fellowship leaderboard"
              subtitle="Only contributors with an official Fellowship application are ranked here. Points are awarded after merge, based on issue difficulty and merged work, not raw lines of code."
            />

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="gap-1.5 rounded-full border-border/70 bg-background/80 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Difficulty-based scoring
              </Badge>
              <Badge variant="outline" className="gap-1.5 rounded-full border-border/70 bg-background/80 px-3 py-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Merged contributions only
              </Badge>
              <Badge variant="outline" className="gap-1.5 rounded-full border-border/70 bg-background/80 px-3 py-1.5">
                <Users2 className="h-3.5 w-3.5" />
                Public-safe profile data
              </Badge>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="overflow-hidden rounded-[1.75rem] border-border/70 bg-card/90 shadow-card">
                <CardHeader className="border-b border-border/70 bg-background/60">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Crown className="h-5 w-5 text-primary" />
                    Top 3 podium
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <LeaderboardSkeleton />
                  ) : podium.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/70 p-8 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
                        <Medal className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">No Fellowship points yet</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        Once Fellowship applications are approved and PRs are merged, the leaderboard will populate automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                      {podium.map((entry, index) => {
                        const rankStyle =
                          index === 0
                            ? "border-amber-400/30 bg-gradient-to-b from-amber-400/15 to-background/80"
                            : index === 1
                              ? "border-slate-400/30 bg-gradient-to-b from-slate-300/15 to-background/80"
                              : "border-orange-400/30 bg-gradient-to-b from-orange-300/15 to-background/80";

                        return (
                          <div
                            key={entry.githubUsername}
                            className={`rounded-[1.5rem] border p-5 shadow-card transition-transform hover:-translate-y-1 ${rankStyle}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <Badge className="rounded-full bg-background/80 text-foreground shadow-none">
                                #{entry.rank}
                              </Badge>
                              <FellowshipBadge />
                            </div>
                            <div className="mt-5 flex items-center gap-4">
                              <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                                <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
                                <AvatarFallback>{initials(entry.githubUsername)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <a
                                  href={entry.profileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block truncate text-lg font-semibold tracking-tight hover:underline"
                                >
                                  @{entry.githubUsername}
                                </a>
                                <div className="truncate text-sm text-muted-foreground">{entry.displayName}</div>
                              </div>
                            </div>
                            <div className="mt-5 grid gap-3">
                              <div className="rounded-2xl border border-border/70 bg-card/85 p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Points</div>
                                <div className="mt-1 text-3xl font-bold tracking-tight">{entry.points}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Merged PRs</div>
                                  <div className="mt-1 font-semibold">{entry.mergedPrs}</div>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">LOC</div>
                                  <div className="mt-1 font-semibold">{entry.loc.toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[1.75rem] border-border/70 bg-card/90 shadow-card">
                <CardHeader className="border-b border-border/70 bg-background/60">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                    How points work
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3">
                    {[
                      { label: "Easy", points: "+5", hint: "Docs, small fixes, tests, accessibility, small UI improvements." },
                      { label: "Medium", points: "+15", hint: "Meaningful features, adapters, backend work, UX improvements." },
                      { label: "Hard", points: "+30", hint: "Substantial features, crawler systems, architecture, performance." },
                      { label: "Expert", points: "+50", hint: "Major infrastructure, cross-stack changes, production or security work." },
                    ].map((tier) => (
                      <div key={tier.label} className="rounded-2xl border border-border/70 bg-background/75 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="font-semibold tracking-tight">{tier.label}</div>
                          <Badge variant="outline" className="rounded-full border-border/70 bg-card/85">
                            {tier.points}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{tier.hint}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-primary/5 p-4 text-sm leading-7 text-muted-foreground">
                    Points are awarded for merged, difficulty-rated work. Raw lines of code are shown as a secondary statistic only.
                    Fellowship membership comes from an approved initiative application with a GitHub username.
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 rounded-[1.75rem] border-border/70 bg-card/90 shadow-card">
              <CardHeader className="border-b border-border/70 bg-background/60">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Medal className="h-5 w-5 text-primary" />
                  Full leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isError ? (
                  <div className="p-6">
                    <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
                      The leaderboard could not be loaded right now.
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => refetch()} className="rounded-full">
                        Try again
                      </Button>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="space-y-3 p-6">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-14 rounded-2xl" />
                    ))}
                  </div>
                ) : entries.length === 0 ? (
                  <div className="p-6">
                    <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/70 p-8 text-center text-sm leading-7 text-muted-foreground">
                      No Fellowship contributions have been recorded yet.
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Rank</TableHead>
                        <TableHead>Contributor</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Merged PRs</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead className="text-right">LOC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => {
                        const difficulty = dominantDifficulty(entry);
                        return (
                          <TableRow key={entry.githubUsername}>
                            <TableCell className="font-semibold">#{entry.rank}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
                                  <AvatarFallback>{initials(entry.githubUsername)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <a href={entry.profileUrl} target="_blank" rel="noreferrer" className="block truncate font-semibold hover:underline">
                                    @{entry.githubUsername}
                                  </a>
                                  <div className="truncate text-xs text-muted-foreground">{entry.displayName}</div>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    <FellowshipBadge />
                                    {entry.contributionAreas.slice(0, 2).map((area) => (
                                      <Badge key={area} variant="outline" className="rounded-full border-border/70 bg-background/80 text-[11px] uppercase tracking-[0.18em]">
                                        {area}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{entry.points}</TableCell>
                            <TableCell className="text-right">{entry.mergedPrs}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{difficulty.label}</div>
                                <div className="text-xs text-muted-foreground">{difficultySummary(entry)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{entry.loc.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
                {!isLoading && !isError && entries.length > 0 ? (
                  <div className="border-t border-border/70 px-6 py-4 text-sm text-muted-foreground">
                    Tie-breakers use hard/expert merges, merged PR count, then the earliest achievement time for deterministic ordering.
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {others.length > 0 ? (
              <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-card/80 p-5 text-sm text-muted-foreground">
                <div className="font-semibold text-foreground">More participants</div>
                <div className="mt-2">
                  The remaining Fellowship contributors continue below the podium view. Their ranking is fully deterministic and updates after merged PRs are recorded.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </Layout>
  );
}
