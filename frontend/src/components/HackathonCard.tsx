import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeInfo, Clock3, MapPin, Radar, Trophy } from "lucide-react";

import { Hackathon, formatDate, getDeadlineInfo, getStatus } from "@/data/hackathons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import { HackathonImage } from "@/components/HackathonImage";

const platformStyles: Record<string, string> = {
  Devpost: "bg-[hsl(var(--accent-cyan)/0.12)] text-[hsl(var(--accent-cyan))] border-[hsl(var(--accent-cyan)/0.2)]",
  MLH: "bg-[hsl(var(--accent-coral)/0.12)] text-[hsl(var(--accent-coral))] border-[hsl(var(--accent-coral)/0.2)]",
  Unstop: "bg-[hsl(var(--accent-yellow)/0.16)] text-[#b56a00] border-[hsl(var(--accent-yellow)/0.2)]",
  Devfolio: "bg-[hsl(var(--accent-violet)/0.12)] text-[hsl(var(--accent-violet))] border-[hsl(var(--accent-violet)/0.2)]",
  default: "bg-secondary text-muted-foreground border-border",
};

export const HackathonCard = ({ h }: { h: Hackathon }) => {
  const deadline = getDeadlineInfo(h);
  const status = getStatus(h);
  const highlight =
    status === "Closing Soon"
      ? "from-destructive/10 via-destructive/5 to-transparent"
      : status === "Open"
        ? "from-primary/10 via-transparent to-transparent"
        : "from-muted/30 via-transparent to-transparent";

  return (
    <Link
      to={`/h/${h.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/95 p-5 shadow-card transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${highlight}`} aria-hidden />
      <div className="pointer-events-none absolute right-4 top-4 h-16 w-16 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" aria-hidden />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm", platformStyles[h.platform] ?? platformStyles.default)}>
            <Radar className="h-3 w-3" />
            {h.platform}
          </span>
          <div className="max-w-[9rem] truncate text-xs text-muted-foreground">{h.organizer}</div>
        </div>
        <StatusBadge variant={status === "Closing Soon" ? "closing" : status === "Open" ? "open" : status === "Ended" ? "ended" : "default"}>
          {deadline.label}
        </StatusBadge>
      </div>

      <div className="mb-4 overflow-hidden rounded-[1.25rem]">
        <HackathonImage
          src={h.imageUrl}
          alt={`${h.title} promotional image`}
          className="rounded-[1.25rem]"
        />
      </div>

      <h3 className="relative mb-2 text-[1.05rem] font-semibold leading-tight tracking-tight text-foreground">{h.title}</h3>

      <p className="mb-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{h.description}</p>

      <div className="mt-auto space-y-4">
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            <span>{formatDate(h.registrationDeadline ?? h.submissionDeadline ?? h.eventEndDate)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{[h.mode, h.country].filter(Boolean).join(" / ")}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {h.prize && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm font-medium text-foreground">
              <Trophy className="h-4 w-4 text-warning" />
              <span>{h.prize}</span>
            </div>
          )}

          {h.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="rounded-full border border-border/70 bg-secondary/70 px-2.5 py-1 font-normal">
              {t}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <BadgeInfo className="h-3.5 w-3.5" />
            Source: {h.platform}
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
};
