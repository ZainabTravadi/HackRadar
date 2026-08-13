import { Layout } from '@/components/Layout';
import SectionHeader from '@/components/ui/SectionHeader';
import FeatureCard from '@/components/ui/FeatureCard';
import { Server, GitBranch, Zap, ShieldCheck, FileText } from 'lucide-react';

const docs = [
  { icon: Server, title: 'API', desc: 'Public endpoints for discovery and programmatic access.', href: '/api' },
  { icon: GitBranch, title: 'Contributing', desc: 'How to contribute adapters, fixes, and documentation.', href: 'https://github.com/ZainabTravadi/List-Of-Hackathons/blob/main/CONTRIBUTING.md' },
  { icon: Zap, title: 'Crawler adapters', desc: 'Adapter patterns and how to add support for new platforms.', href: 'https://github.com/ZainabTravadi/List-Of-Hackathons/tree/main/backend/src/crawler/adapters' },
  { icon: FileText, title: 'Architecture', desc: 'High level system overview and data flow for contributors.', href: 'https://github.com/ZainabTravadi/List-Of-Hackathons#readme' },
  { icon: ShieldCheck, title: 'Transparency', desc: 'Transparency reports and data quality notes.', href: '/transparency' },
  { icon: Server, title: 'Roadmap', desc: 'Planned priorities and upcoming work.', href: '/roadmap' },
];

export default function Docs() {
  return (
    <Layout>
      <section className="py-16">
        <div className="container max-w-4xl text-center">
          <SectionHeader title="Developers & Documentation" subtitle="Resources for integrators, contributors, and maintainers." center />

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {docs.map((d) => (
              <a key={d.title} href={d.href} target={d.href.startsWith('http') ? '_blank' : undefined} rel={d.href.startsWith('http') ? 'noreferrer' : undefined} className="group">
                <FeatureCard icon={d.icon} title={d.title} desc={d.desc} />
              </a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
