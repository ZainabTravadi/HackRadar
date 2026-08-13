import { Link } from "react-router-dom";
import { Calendar, MapPin, Trophy, ArrowUpRight } from "lucide-react";
import { Hackathon, formatDate, getDeadlineInfo, getStatus } from "@/data/hackathons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";

const platformStyles: Record<string, string> = {
  Devpost: "bg-blue-50 text-blue-700 border-blue-100",
  MLH: "bg-rose-50 text-rose-700 border-rose-100",
  Unstop: "bg-amber-50 text-amber-700 border-amber-100",
  Devfolio: "bg-violet-50 text-violet-700 border-violet-100",
  default: "bg-slate-50 text-slate-700 border-slate-200",
};

export const HackathonCard = ({ h }: { h: Hackathon }) => {
  const deadline = getDeadlineInfo(h);
  const status = getStatus(h);

  return (
    <Link
      to={`/h/${h.slug}`}
      className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-1 hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium", platformStyles[h.platform] ?? platformStyles.default)}>
            {h.platform}
          </span>
          <div className="text-xs text-muted-foreground">{h.organizer}</div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge variant={status === 'Closing Soon' ? 'closing' : status === 'Open' ? 'open' : status === 'Ended' ? 'ended' : 'default'}>{deadline.label}</StatusBadge>
        </div>
      </div>

      <h3 className="mb-2 text-lg font-semibold leading-tight tracking-tight text-foreground">{h.title}</h3>

      <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">{h.description}</p>

      <div className="mt-auto flex items-center justify-between gap-3">
        <div className="flex flex-col"> 
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(h.registrationDeadline ?? h.submissionDeadline ?? h.eventEndDate)}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{h.mode}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {h.prize && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Trophy className="h-4 w-4" />
              <span>{h.prize}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {h.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="rounded-full font-normal">{t}</Badge>
            ))}
          </div>

          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
};
