import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import SectionHeader from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/button';

type GhContributor = { id: number; login: string; avatar_url: string; html_url: string };

export default function Contributors() {
  const [contributors, setContributors] = useState<GhContributor[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch('https://api.github.com/repos/ZainabTravadi/List-Of-Hackathons/contributors');
        if (!resp.ok) throw new Error('Failed to fetch');
        const data = await resp.json();
        if (Array.isArray(data)) {
          const list = data.slice(0, 50).map((d) => {
            const dd = d as Record<string, unknown>;
            return {
              id: Number(dd.id),
              login: String(dd.login),
              avatar_url: String(dd.avatar_url),
              html_url: String(dd.html_url),
            } as GhContributor;
          });
          setContributors(list);
        }
      } catch (e: unknown) {
        setError('Could not load contributors');
      }
    }
    load();
  }, []);

  return (
    <Layout>
      <section className="container py-12">
        <SectionHeader title="The people building HackRadar" subtitle="Open-source contributors who help keep HackRadar running and improving." />

        {error ? <div className="mt-4 text-destructive">{error}</div> : null}

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {contributors.length === 0 ? (
            <div className="p-8 text-center col-span-full">
              We're building the community. Be one of the people who helps shape HackRadar.
              <div className="mt-4">
                <Button asChild>
                  <a href="/join">Join the initiative</a>
                </Button>
              </div>
            </div>
          ) : contributors.map((c) => (
            <a key={c.id} href={c.html_url} target="_blank" rel="noreferrer" className="rounded-lg border p-4 text-center hover:shadow-elevated">
              <img src={c.avatar_url} alt={c.login} className="mx-auto h-20 w-20 rounded-full" />
              <div className="mt-2 font-medium">{c.login}</div>
              <div className="mt-1 text-xs text-muted-foreground">GitHub</div>
            </a>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="text-sm text-muted-foreground">Want to see your name here?</div>
          <div className="mt-3 flex justify-center gap-3">
            <Button asChild>
              <a href="/join">Join the Initiative</a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://github.com/ZainabTravadi/List-Of-Hackathons" target="_blank" rel="noreferrer">View on GitHub</a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
