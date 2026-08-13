import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SectionHeader from '@/components/ui/SectionHeader';

const steps = [
  'Sources',
  'Collection',
  'Normalization',
  'Discovery',
  'Community'
];

const HowItWorks = () => (
  <div className="mt-6 grid gap-6 md:grid-cols-5">
    {steps.map((s) => (
      <div key={s} className="md:col-span-1 text-center">
        <div className="text-sm font-semibold">{s}</div>
        <p className="mt-2 text-sm text-muted-foreground">{
          s === 'Sources' ? 'Platforms, organizers, community pages' :
          s === 'Collection' ? 'Crawler adapters gather public event data' :
          s === 'Normalization' ? 'Events are transformed into a consistent model' :
          s === 'Discovery' ? 'Search, filters, and detail pages for discovery' :
          'Open source contributors improve coverage and quality'
        }</p>
      </div>
    ))}
  </div>
);

const About = () => {
  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto max-w-3xl text-center">
          <SectionHeader title="Making hackathon discovery more accessible" subtitle="An open-source effort to reduce friction and improve discoverability." />

          <div className="mt-8">
            <h2 className="text-2xl font-semibold">The problem</h2>
            <p className="mt-3 text-muted-foreground">Hackathons and opportunities are published across many platforms, university sites, and community channels. That fragmentation makes discovery difficult for students and developers worldwide.</p>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold">Our mission</h2>
            <p className="mt-3 text-muted-foreground">Make hackathons and technical opportunities easier to discover, regardless of where someone lives or learns.</p>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold">How HackRadar works</h2>
            <HowItWorks />
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold">Open source</h2>
            <p className="mt-3 text-muted-foreground">HackRadar is developed in the open. Developers can inspect the code, contribute adapters, improve data quality, and help shape the project.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button asChild size="sm" className="bg-primary-gradient">
                <a href="https://github.com/ZainabTravadi/List-Of-Hackathons" target="_blank" rel="noreferrer">View on GitHub</a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/hackathons">Explore Hackathons</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
