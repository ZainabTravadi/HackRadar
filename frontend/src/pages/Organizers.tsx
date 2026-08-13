import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SectionHeader from '@/components/ui/SectionHeader';
import FeatureCard from '@/components/ui/FeatureCard';
import { Search, Code, Link as LinkIcon, AlertCircle, Users } from 'lucide-react';

const features = [
  { icon: Search, title: 'How we discover events', desc: 'Crawlers and adapters index public event listings across platforms and normalize metadata for discoverability.' },
  { icon: Code, title: 'Crawler adapters', desc: 'Adapters are small, auditable parsers that extract event data from public pages — they live in the repository and can be improved via PRs.' },
  { icon: LinkIcon, title: 'Source attribution', desc: 'Every listing links back to the original event page so attendees can verify details with the organizer.' },
  { icon: AlertCircle, title: 'Reporting incorrect info', desc: 'If details are wrong, use the report link on an event to open a pre-filled GitHub issue with source context.' },
  { icon: Users, title: 'What organizers should know', desc: 'We aim to surface official pages. Use the submit form for missing events or to correct the canonical link.' },
];

const Organizers = () => (
  <Layout>
    <section className="bg-hero-gradient py-16">
      <div className="container max-w-4xl text-center">
        <SectionHeader title={<>Run a hackathon? <span className="text-primary">Help people find it.</span></>} subtitle="HackRadar is a discovery layer — we index public event pages and link back to the official source." center />
        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="bg-primary-gradient">
            <Link to="/submit">Submit a Hackathon</Link>
          </Button>
        </div>
      </div>
    </section>

    <section className="py-12">
      <div className="container max-w-4xl">
        <div className="grid gap-6 md:grid-cols-3">
          {features.slice(0,3).map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {features.slice(3).map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold">What organizers should expect</h3>
          <ul className="mt-3 list-inside list-decimal text-sm text-muted-foreground">
            <li>Listings link back to the original event page — we do not claim ownership of events.</li>
            <li>Submissions are reviewed for quality; this may take a short time.</li>
            <li>If you need removal or sensitive edits, open a GitHub issue and provide proof of ownership.</li>
          </ul>
          <div className="mt-4">
            <Button asChild size="sm" variant="outline">
              <Link to="/submit">Open the submit form</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export default Organizers;
