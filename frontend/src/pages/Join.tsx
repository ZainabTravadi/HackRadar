import { useState } from 'react';

import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiFetchJson } from '@/lib/api';
import ProgressStepper from '@/components/ui/ProgressStepper';
import ContributionCard from '@/components/ui/ContributionCard';
import SectionHeader from '@/components/ui/SectionHeader';

const CONTRIBUTION_AREAS = ['engineering', 'frontend', 'backend', 'crawler', 'data', 'design', 'documentation', 'testing', 'accessibility', 'community', 'outreach', 'translation', 'partnerships', 'other'];
const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const AVAILABILITY = ['1-3 hours/week', '3-5 hours/week', '5-10 hours/week', '10+ hours/week', 'Flexible / varies'];

export default function Join() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [contributionTypes] = useState<string[]>([]);
  const [motivation, setMotivation] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  function toggleArea(area: string) {
    setAreas((previous) => (previous.includes(area) ? previous.filter((value) => value !== area) : [...previous, area]));
  }

  async function submit() {
    setError(null);

    if (!name.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setStatus('error');
      setError('Provide a name and a valid email.');
      setStep(1);
      return;
    }

    if (areas.length === 0) {
      setStatus('error');
      setError('Select at least one contribution area.');
      setStep(2);
      return;
    }

    setStatus('submitting');

    try {
      await apiFetchJson<{ success: boolean; applicationId: string }>('/api/initiative/applications', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          githubUsername: github,
          linkedinUrl: linkedin,
          websiteUrl: website,
          contributionAreas: areas,
          experienceLevel: experience,
          availability,
          contributionTypes,
          motivation,
        }),
      });

      setStatus('success');
      setStep(4);
    } catch (err: unknown) {
      setStatus('error');
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Submission failed');
    }
  }

  if (status === 'success') {
    return (
      <Layout>
        <section className="container py-16 text-center">
          <h1 className="text-3xl font-semibold">You are on the radar. 🚀</h1>
          <p className="mt-4 text-muted-foreground">Thanks for your interest. We'll review submissions and may follow up if we need more details. Start contributing now on GitHub.</p>
          <div className="mt-6 flex justify-center gap-3">
            <a href="https://github.com/ZainabTravadi/List-Of-Hackathons" target="_blank" rel="noreferrer" className="btn">View on GitHub</a>
            <a href="/about" className="btn btn-outline">Read Contribution Guide</a>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-12">
        <div className="mx-auto max-w-3xl">
          <SectionHeader title="Join the initiative" subtitle="Contribute to HackRadar — pick areas, availability, and tell us what you'd like to build." center={false} />

          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Step</div>
                <div className="mt-2"><ProgressStepper step={step} steps={4} /></div>
              </div>
              <div className="text-sm text-muted-foreground max-w-xs">We review submissions and may follow up. Your contact details are used only to coordinate contributions.</div>
            </div>

            {error ? <div role="alert" className="mb-4 text-sm text-destructive">{error}</div> : null}

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="join-name" className="text-sm font-medium">Name *</label>
                  <Input id="join-name" aria-label="Name *" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="join-email" className="text-sm font-medium">Email *</label>
                  <Input id="join-email" aria-label="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              {step === 1 && (
                <div key={`step-${1}`} className="animate-fade-in motion-reduce:animate-none transition-all duration-300">
                  <div className="text-sm text-muted-foreground">Provide your name and a contact email so we can follow up if needed.</div>
                  <div className="mt-4 flex justify-end">
                    <Button className="bg-primary-gradient" onClick={() => setStep(2)}>Next</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div key={`step-${2}`} className="animate-fade-in motion-reduce:animate-none transition-all duration-300 space-y-4">
                  <div className="text-sm text-muted-foreground">Tip: pick areas you can commit to. You can select multiple.</div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {CONTRIBUTION_AREAS.map((area) => (
                      <ContributionCard key={area} label={area} selected={areas.includes(area)} onClick={() => toggleArea(area)} />
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button className="bg-primary-gradient" onClick={() => setStep(3)}>Next</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div key={`step-${3}`} className="animate-fade-in motion-reduce:animate-none transition-all duration-300 space-y-4">
                  <div className="text-sm text-muted-foreground">Tell us your experience level and roughly how many hours you can contribute weekly.</div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="join-experience" className="text-sm font-medium">Experience level</label>
                      <select id="join-experience" className="w-full rounded-md border p-2" value={experience} onChange={(e) => setExperience(e.target.value)}>
                        <option value="">Choose...</option>
                        {EXPERIENCE.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="join-availability" className="text-sm font-medium">Availability</label>
                      <select id="join-availability" className="w-full rounded-md border p-2" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                        <option value="">Choose...</option>
                        {AVAILABILITY.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button className="bg-primary-gradient" onClick={() => setStep(4)}>Next</Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div key={`step-${4}`} className="animate-fade-in motion-reduce:animate-none transition-all duration-300 space-y-4">
                  <div className="text-sm text-muted-foreground">Example: "I'd like to improve data quality by adding tests for the Devpost adapter and cleaning duplicates."</div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="join-github" className="text-sm font-medium">GitHub</label>
                      <Input id="join-github" value={github} onChange={(e) => setGithub(e.target.value)} />
                    </div>

                    <div>
                      <label htmlFor="join-linkedin" className="text-sm font-medium">LinkedIn</label>
                      <Input id="join-linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="join-website" className="text-sm font-medium">Website</label>
                    <Input id="join-website" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>

                  <div>
                    <label htmlFor="join-motivation" className="text-sm font-medium">What would you like to do?</label>
                    <Textarea id="join-motivation" value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="E.g. improve crawler coverage, add tests, fix normalization heuristics..." />
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                    <Button className="bg-primary-gradient" onClick={() => void submit()} disabled={status === 'submitting'}>{status === 'submitting' ? 'Submitting...' : 'Submit'}</Button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button onClick={() => void submit()} disabled={status === 'submitting'}>{status === 'submitting' ? 'Submitting...' : 'Submit'}</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
