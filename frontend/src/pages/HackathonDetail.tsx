import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, ExternalLink, MapPin, Trophy, Users } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, getDaysUntil, getStatus, useHackathon } from "@/data/hackathons";

const HackathonDetail = () => {
  const { slug } = useParams();
  const { data: h, isLoading, error } = useHackathon(slug);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-semibold">Loading hackathon…</h1>
        </div>
      </Layout>
    );
  }

  if (error || !h) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-semibold">Hackathon not found</h1>
          <Button asChild variant="link"><Link to="/hackathons">Back to all hackathons</Link></Button>
        </div>
      </Layout>
    );
  }

  const days = getDaysUntil(h.registrationDeadline);
  const status = getStatus(h);

  return (
    <Layout>
      <section className="bg-hero-gradient pb-16 pt-12">
        <div className="container max-w-4xl">
          <Link to="/hackathons" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All hackathons
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">{h.platform}</Badge>
            <Badge
              className={`rounded-full ${
                status === "Closing Soon" ? "bg-destructive/10 text-destructive hover:bg-destructive/15" :
                status === "Open" ? "bg-success/10 text-success hover:bg-success/15" :
                "bg-muted text-muted-foreground"
              }`}
            >
              {status === "Ended" ? "Ended" : `Closes in ${days} days`}
            </Badge>
          </div>

          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            {h.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{h.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-primary-gradient shadow-glow">
              <a href={h.url} target="_blank" rel="noopener noreferrer">
                Visit Official Site <ExternalLink className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/hackathons">Browse more</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="grid gap-5 md:grid-cols-2">
            <DetailCard icon={Calendar} label="Registration Deadline" value={formatDate(h.registrationDeadline)} highlight />
            <DetailCard icon={Calendar} label="Submission Deadline" value={formatDate(h.submissionDeadline)} />
            <DetailCard icon={MapPin} label="Mode" value={h.mode + (h.country ? ` · ${h.country}` : "")} />
            {h.prize && <DetailCard icon={Trophy} label="Prize Pool" value={h.prize} />}
            <DetailCard icon={Users} label="Organizer" value={h.organizer} />
            <DetailCard icon={Clock} label="Last Updated" value={`${h.updatedHoursAgo}h ago · Source: ${h.platform}`} />
          </div>

          <div className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {h.tags.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full px-3 py-1 text-sm font-normal">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const DetailCard = ({
  icon: Icon, label, value, highlight,
}: { icon: any; label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-2xl border p-5 shadow-card ${highlight ? "border-primary/30 bg-accent" : "border-border bg-card"}`}>
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <div className={`mt-2 text-lg font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
  </div>
);

export default HackathonDetail;
