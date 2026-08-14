import { Link, NavLink, useLocation } from "react-router-dom";
import { Radar, Menu, Github, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const GITHUB_URL = "https://github.com/ZainabTravadi/List-Of-Hackathons";

const community = [
  { to: '/join', label: 'Contribute' },
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

  const linkClass = (isActive: boolean) =>
    cn(
      "relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-primary text-primary-foreground shadow-glow"
        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
    );

  const contributeClass = (isActive: boolean) =>
    cn(
      "relative rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200",
      isActive
        ? "border-primary/30 bg-primary-gradient text-primary-foreground shadow-glow"
        : "border-primary/15 bg-primary/8 text-primary hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/12",
    );

  return (
    <header className="sticky top-3 z-50 mx-auto w-full max-w-7xl px-3">
      <div className="glass-surface-strong animate-fade-in-up rounded-[1.4rem] px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 font-semibold text-foreground">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
              <Radar className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base tracking-tight">HackRadar</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">Open-source discovery</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink to="/hackathons" className={({ isActive }) => linkClass(isActive || location.pathname.startsWith("/hackathons"))}>
              Discover
            </NavLink>
            <NavLink to="/join" className={({ isActive }) => contributeClass(isActive)}>
              Contribute
            </NavLink>
            <NavLink to="/transparency" className={({ isActive }) => linkClass(isActive)}>
              Transparency
            </NavLink>

            <details className="group relative">
              <summary className="list-none rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground">
                Community
              </summary>
              <div className="absolute left-0 mt-3 w-56 rounded-2xl border border-border bg-card p-2 shadow-elevated">
                {community.map((c) => (
                  <NavLink
                    key={c.to}
                    to={c.to}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-xl px-3 py-2 text-sm transition-colors",
                        isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      )
                    }
                  >
                    {c.label}
                  </NavLink>
                ))}
              </div>
            </details>

            <details className="group relative">
              <summary className="list-none rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground">
                Project
              </summary>
              <div className="absolute left-0 mt-3 w-56 rounded-2xl border border-border bg-card p-2 shadow-elevated">
                {project.map((p) => (
                  <NavLink
                    key={p.to}
                    to={p.to}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-xl px-3 py-2 text-sm transition-colors",
                        isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      )
                    }
                  >
                    {p.label}
                  </NavLink>
                ))}
              </div>
            </details>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <Button asChild size="sm" className="bg-primary-gradient shadow-glow hover:opacity-95">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>

          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="border-border/80 bg-background/95 backdrop-blur-xl">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Navigate HackRadar
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 grid gap-2">
                  <NavLink to="/hackathons" onClick={() => setOpen(false)} className={({ isActive }) => linkClass(isActive || location.pathname.startsWith("/hackathons"))}>
                    Discover
                  </NavLink>
                  <NavLink to="/join" onClick={() => setOpen(false)} className={({ isActive }) => contributeClass(isActive)}>
                    Contribute
                  </NavLink>
                  <NavLink to="/transparency" onClick={() => setOpen(false)} className={({ isActive }) => linkClass(isActive)}>
                    Transparency
                  </NavLink>
                  <div className="mt-3 rounded-2xl border border-border bg-card p-2">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Community</div>
                    {community.map((c) => (
                      <NavLink key={c.to} to={c.to} onClick={() => setOpen(false)} className={({ isActive }) => cn("block rounded-xl px-3 py-2 text-sm", isActive ? "bg-secondary text-foreground" : "text-muted-foreground")}>
                        {c.label}
                      </NavLink>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl border border-border bg-card p-2">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Project</div>
                    {project.map((p) => (
                      <NavLink key={p.to} to={p.to} onClick={() => setOpen(false)} className={({ isActive }) => cn("block rounded-xl px-3 py-2 text-sm", isActive ? "bg-secondary text-foreground" : "text-muted-foreground")}>
                        {p.label}
                      </NavLink>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Button asChild className="flex-1 bg-primary-gradient">
                      <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                        View on GitHub
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                        Repo
                      </a>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
