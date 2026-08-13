import { Layout } from '@/components/Layout';
import SectionHeader from '@/components/ui/SectionHeader';

const categories = ['PRs', 'Issues', 'Reviews', 'Crawler contributions', 'Documentation', 'Accessibility', 'Community'];

export default function Leaderboard() {
  return (
    <Layout>
      <section className="container py-12">
        <SectionHeader title="Contribution leaderboard" subtitle="Recognition is coming — here’s the structure we’ll use to spotlight contributors." />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-sm font-semibold">{c}</div>
              <div className="mt-3 text-sm text-muted-foreground">No public data yet. This section will list top contributors for {c.toLowerCase()}.</div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">Want to help shape this recognition system? Contribute on GitHub or join the initiative.</p>
        </div>
      </section>
    </Layout>
  );
}
