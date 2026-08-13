import { Layout } from '@/components/Layout';
// Use local header here to ensure left alignment with explanatory copy
import { Button } from '@/components/ui/button';

const buckets = [
  { key: 'Now', items: ['Discovery improvements and server-side filtering', 'Community initiative: Join form and contributors list', 'Documentation and transparency pages'] },
  { key: 'Next', items: ['Public crawler health summaries', 'API improvements and clearer docs', 'Normalization and deduplication refinements'] },
  { key: 'Exploring', items: ['SDKs and client libraries', 'Contributor recognition features', 'Improved search and recommendations'] },
  { key: 'Completed', items: ['Hackathon discovery UI and filters', 'Server-side filtering and normalized API', 'Community Join flow (Phase 3)'] },
];

export default function Roadmap() {
  return (
    <Layout>
      <section className="py-16">
        <div className="container max-w-6xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">Roadmap</h2>
              <p className="mt-4 text-muted-foreground">A transparent view of priorities — what we’re working on, planning, and ideas we’re exploring.</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={() => window.location.assign('/join')}>Contribute</Button>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground max-w-2xl">Roadmap buckets are ordered by priority. Use the "Contribute" button to join the initiative or propose improvements to any item.</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {buckets.map((b) => (
              <div key={b.key} className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{b.key}</h3>
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{b.items.length}</span>
                </div>

                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {b.items.map((it) => (
                    <li key={it} className="rounded-md p-2 hover:bg-accent/5">{it}</li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Last updated: ongoing</div>
                  <button className="text-xs text-primary hover:underline" onClick={() => alert(`Want to contribute to: ${b.key}`)}>Discuss</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
