import { Link } from "react-router-dom";
import { Calendar, MapPin, Trophy, ArrowUpRight } from "lucide-react";
import { Hackathon, formatDate, getDaysUntil, getStatus } from "@/data/hackathons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const platformStyles: Record<string, string> = {
  Devpost: "bg-blue-50 text-blue-700 border-blue-100",
  MLH: "bg-rose-50 text-rose-700 border-rose-100",
  Unstop: "bg-amber-50 text-amber-700 border-amber-100",
  Devfolio: "bg-violet-50 text-violet-700 border-violet-100",
  default: "bg-slate-50 text-slate-700 border-slate-200",
};

export const HackathonCard = ({ h }: { h: Hackathon }) => {
  const days = getDaysUntil(h.registrationDeadline);
  const status = getStatus(h);

  return (
    <Link
      to={`/h/${h.slug}`}
      className="group relative flex flex-col rounded-2xl border border-border bg-card-gradient p-6 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            platformStyles[h.platform] ?? platformStyles.default
          )}
        >
          {h.platform}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            status === "Closing Soon" && "bg-destructive/10 text-destructive",
            status === "Open" && "bg-success/10 text-success",
            status === "Ended" && "bg-muted text-muted-foreground"
          )}
        >
          {status === "Ended" ? "Ended" : `Closes in ${days}d`}
        </span>
      </div>

      <h3 className="mb-2 text-lg font-semibold leading-tight tracking-tight text-foreground">
        {h.title}
      </h3>
      <p className="mb-5 line-clamp-2 text-sm text-muted-foreground">{h.description}</p>

      <div className="mb-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(h.registrationDeadline)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span>{h.mode}</span>
        </div>
        {h.prize && (
          <div className="flex items-center gap-1.5 col-span-2">
            <Trophy className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{h.prize}</span>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {h.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="rounded-full font-normal">
              {t}
            </Badge>
          ))}
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-smooth group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};
