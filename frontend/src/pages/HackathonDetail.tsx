import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, ExternalLink, MapPin, Trophy, Users } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SectionHeader from "@/components/ui/SectionHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, getDeadlineInfo, getStatus, useHackathon } from "@/data/hackathons";

const HackathonDetail = () => {
  const { slug } = useParams();
  const { data: h, isLoading, error } = useHackathon(slug);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-semibold">Loading hackathon...</h1>
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

  const deadline = getDeadlineInfo(h);
  const status = getStatus(h);

  return (
    <Layout>
      <section className="bg-hero-gradient pb-12 pt-8">
        <div className="container">
          <Link to="/hackathons" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All hackathons
          </Link>

          <div className="mt-6">
            <SectionHeader
              title={h.title}
              subtitle={<span className="text-lg text-muted-foreground">{h.description}</span>}
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full">{h.platform}</Badge>
              <StatusBadge variant={getStatus(h) === 'Closing Soon' ? 'closing' : getStatus(h) === 'Open' ? 'open' : 'ended'}>{getDeadlineInfo(h).label}</StatusBadge>
              <div className="ml-auto flex gap-3">
                <Button asChild size="md" className="bg-primary-gradient">
                  <a href={h.url} target="_blank" rel="noopener noreferrer">Visit Official Site <ExternalLink className="ml-1.5 h-4 w-4" /></a>
                </Button>
                <Button variant="outline" size="md" asChild>
                  <Link to="/hackathons">Browse more</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-3">Event details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailCard icon={Calendar} label="Registration Deadline" value={formatDate(h.registrationDeadline)} />
                  <DetailCard icon={Calendar} label="Submission Deadline" value={formatDate(h.submissionDeadline)} />
                  <DetailCard icon={Calendar} label="Event End Date" value={formatDate(h.eventEndDate)} />
                  <DetailCard icon={MapPin} label="Mode" value={h.mode + (h.country ? ` · ${h.country}` : "")} />
                  {h.prize && <DetailCard icon={Trophy} label="Prize Pool" value={h.prize} />}
                  <DetailCard icon={Users} label="Organizer" value={h.organizer} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <div className="prose max-w-none text-muted-foreground">{h.description}</div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">Last updated</div>
                <div className="mt-2 text-sm font-medium">{h.updatedHoursAgo}h ago · Source: {h.platform}</div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h4 className="text-sm font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {h.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full px-3 py-1 text-sm font-normal">{t}</Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h4 className="text-sm font-semibold mb-2">Report an issue</h4>
                <p className="text-sm text-muted-foreground">Found incorrect information? Open a prefilled GitHub issue.</p>
                <div className="mt-3">
                  {(() => {
                    const repo = "ZainabTravadi/List-Of-Hackathons";
                    const title = `[Data Issue] ${h.title}`;
                    const body = `I found a possible data issue with the following listing:\n\n- Title: ${h.title}\n- Source: ${h.platform}\n- Source URL: ${h.url}\n- Site slug: ${h.slug || ''}\n\nPlease describe the problem and any supporting links or screenshots here.`;
                    const issueUrl = `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

                    return (
                      <Button asChild size="sm" variant="outline">
                        <a href={issueUrl} target="_blank" rel="noopener noreferrer">Report incorrect information</a>
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

type DetailCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ComponentType<Record<string, unknown>>;
  label: string;
  value: string;
  highlight?: boolean;
};

const DetailCard = ({ icon: Icon, label, value, highlight }: DetailCardProps) => (
  <div className={`rounded-2xl border p-5 shadow-card ${highlight ? "border-primary/30 bg-accent" : "border-border bg-card"}`}>
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <div className={`mt-2 text-lg font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
  </div>
);

export default HackathonDetail;
