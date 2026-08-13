import { Link, NavLink, useLocation } from "react-router-dom";
import { Radar, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GITHUB_URL = "https://github.com/ZainabTravadi/List-Of-Hackathons";

const community = [
  { to: '/join', label: 'Join' },
  { to: '/contributors', label: 'Contributors' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

const project = [
  { to: '/about', label: 'About' },
  { to: '/transparency', label: 'Transparency' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/governance', label: 'Governance' },
  { to: '/impact', label: 'Impact' },
  { to: '/docs', label: 'Docs' },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-gradient text-primary-foreground shadow-glow">
            <Radar className="h-4 w-4" />
          </span>
          <span className="text-base tracking-tight">HackRadar</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/hackathons" className={({ isActive }) => cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive || location.pathname.startsWith('/hackathons') ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60')}>
            Discover
          </NavLink>

          <div className="group relative">
            <details className="relative">
              <summary className="list-none rounded-md px-3 py-2 text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground hover:bg-secondary/60">Community</summary>
              <div className="absolute left-0 mt-2 w-44 rounded-md border border-border bg-card p-2 shadow-card">
                {community.map((c) => (
                  <NavLink key={c.to} to={c.to} className={({ isActive }) => cn('block rounded px-2 py-2 text-sm', isActive ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground')}>
                    {c.label}
                  </NavLink>
                ))}
              </div>
            </details>
          </div>

          <div className="group relative">
            <details className="relative">
              <summary className="list-none rounded-md px-3 py-2 text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground hover:bg-secondary/60">Project</summary>
              <div className="absolute left-0 mt-2 w-48 rounded-md border border-border bg-card p-2 shadow-card">
                {project.map((p) => (
                  <NavLink key={p.to} to={p.to} className={({ isActive }) => cn('block rounded px-2 py-2 text-sm', isActive ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground')}>
                    {p.label}
                  </NavLink>
                ))}
              </div>
            </details>
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a>
          <Button asChild size="sm" className="bg-primary-gradient shadow-glow hover:opacity-95">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">View on GitHub</a>
          </Button>
        </div>

        <button
          className="md:hidden rounded-md p-2 text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container flex flex-col gap-4 py-4">
            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Discover</div>
              <NavLink to="/hackathons" onClick={() => setOpen(false)} className={({ isActive }) => cn('block rounded-md px-3 py-2 text-sm font-medium', isActive ? 'text-foreground bg-secondary' : 'text-muted-foreground')}>Hackathons</NavLink>
              <NavLink to="/organizers" onClick={() => setOpen(false)} className={({ isActive }) => cn('mt-2 block rounded-md px-3 py-2 text-sm font-medium', isActive ? 'text-foreground bg-secondary' : 'text-muted-foreground')}>Organizers</NavLink>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Community</div>
              {community.map((c) => (
                <NavLink key={c.to} to={c.to} onClick={() => setOpen(false)} className={({ isActive }) => cn('block rounded-md px-3 py-2 text-sm font-medium', isActive ? 'text-foreground bg-secondary' : 'text-muted-foreground')}>{c.label}</NavLink>
              ))}
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Project</div>
              {project.map((p) => (
                <NavLink key={p.to} to={p.to} onClick={() => setOpen(false)} className={({ isActive }) => cn('block rounded-md px-3 py-2 text-sm font-medium', isActive ? 'text-foreground bg-secondary' : 'text-muted-foreground')}>{p.label}</NavLink>
              ))}
            </div>

            <div>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a>
              <div className="mt-2">
                <Button asChild size="sm" className="bg-primary-gradient">
                  <a href={GITHUB_URL} onClick={() => setOpen(false)} target="_blank" rel="noreferrer">View on GitHub</a>
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
