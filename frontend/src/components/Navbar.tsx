import { Link, NavLink, useLocation } from "react-router-dom";
import { Radar, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/hackathons", label: "Hackathons" },
  { to: "/hackathons/closing-soon", label: "Closing Soon" },
  { to: "/api", label: "API" },
  { to: "/submit", label: "Submit" },
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
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive || location.pathname.startsWith(l.to)
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex">
          <Button asChild size="sm" className="bg-primary-gradient shadow-glow hover:opacity-95">
            <Link to="/hackathons">Explore Hackathons</Link>
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
          <nav className="container flex flex-col gap-1 py-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive ? "text-foreground bg-secondary" : "text-muted-foreground"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Button asChild size="sm" className="mt-2 bg-primary-gradient">
              <Link to="/hackathons" onClick={() => setOpen(false)}>Explore Hackathons</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};
