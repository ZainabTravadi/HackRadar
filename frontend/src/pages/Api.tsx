import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import SectionHeader from '@/components/ui/SectionHeader';
import { getApiBaseUrl } from "@/lib/api";

const endpoints = [
  {
    method: "GET",
    path: "/api/hackathons",
    desc: "List all active hackathons. Sorted by closing soonest by default.",
    sample: `[
  {
    "slug": "global-ai-summit-2026",
    "title": "Global AI Summit Hack",
    "platform": "Devpost",
    "mode": "Online",
    "registrationDeadline": "2026-04-22T...",
    "prize": "$250,000",
    "tags": ["AI", "LLM"]
  }
]`,
  },
  {
    method: "GET",
    path: "/api/hackathons?theme=ai",
    desc: "Filter by theme. Supports: ai, web3, fintech, climate, gaming, hardware, and more.",
    sample: `[ { "slug": "global-ai-summit-2026", "tags": ["AI", "LLM"] } ]`,
  },
  {
    method: "GET",
    path: "/api/hackathons?mode=online&status=closing-soon",
    desc: "Combine filters. Available: mode, status, country, platform, theme.",
    sample: `[ /* filtered results */ ]`,
  },
  {
    method: "GET",
    path: "/api/hackathons/:slug",
    desc: "Fetch a single hackathon by slug.",
    sample: `{ "slug": "global-ai-summit-2026", "description": "...", "submissionDeadline": "..." }`,
  },
];

const Api = () => (
  <Layout>
    <section className="bg-hero-gradient py-16">
      <div className="container max-w-3xl text-center">
        <Badge variant="secondary" className="rounded-full">
          Public API · v1
        </Badge>
        <SectionHeader title={<>The hackathon <span className="font-serif-display italic text-primary">API</span></>} subtitle="Programmatic access to normalized event discovery data." />
        <p className="mt-3 text-muted-foreground">
          Free for developers. No auth required. Cached every 6 hours.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-sm shadow-card">
          <span className="text-muted-foreground">Base URL</span>
          <span className="font-medium text-foreground">{getApiBaseUrl()}</span>
        </div>
      </div>
    </section>

    <section className="py-16">
      <div className="container max-w-3xl space-y-6">
        {endpoints.map((endpoint) => (
          <div key={endpoint.path} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center gap-3 border-b border-border bg-secondary/40 px-5 py-3">
              <Badge className={endpoint.method === 'GET' ? 'rounded-md bg-blue-600/10 text-blue-500 font-mono' : 'rounded-md bg-emerald-600/10 text-emerald-500 font-mono'}>
                {endpoint.method}
              </Badge>
              <code className="font-mono text-sm font-medium text-foreground">{endpoint.path}</code>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground">{endpoint.desc}</p>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-xs leading-relaxed text-foreground">
{endpoint.sample}
              </pre>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <h3 className="text-lg font-semibold">Need higher rate limits?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Email <a className="text-primary underline" href="mailto:api@hackradar.dev">api@hackradar.dev</a>
          </p>
        </div>
      </div>
    </section>
  </Layout>
);

export default Api;
