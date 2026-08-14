import { Link } from "react-router-dom";
import { ArrowUpRight, Github, HeartPulse, Radar } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="mt-12 border-t border-border/60 bg-gradient-to-b from-background to-secondary/25">
      <div className="container py-14">
        <div className="glass-surface-strong overflow-hidden rounded-[2rem]">
          <div className="grid gap-8 p-6 md:grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] md:p-8">
            <div className="relative md:pr-8">
              <div className="absolute inset-0 -z-10 bg-radar-gradient opacity-70 blur-2xl" aria-hidden />
              <Link to="/" className="flex items-center gap-3 font-semibold text-foreground">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
                  <Radar className="h-5 w-5" />
                </span>
                <span className="text-lg tracking-tight">HackRadar</span>
              </Link>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                HackRadar is an open-source discovery engine for hackathons and technical opportunities, built in public with the community.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://github.com/ZainabTravadi/List-Of-Hackathons"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
                <Link
                  to="/join"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Join the initiative
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <FooterColumn title="Discover" links={[["/hackathons", "Hackathons"], ["/organizers", "Organizers"]]} />
            <FooterColumn title="Community" links={[["/join", "Join"], ["/contributors", "Contributors"], ["/leaderboard", "Leaderboard"]]} />
            <FooterColumn title="Project" links={[["/about", "About"], ["/transparency", "Transparency"], ["/roadmap", "Roadmap"], ["/governance", "Governance"], ["/impact", "Impact"], ["/docs", "Docs"], ["/api", "API"]]} />
          </div>

          <div className="flex flex-col gap-4 border-t border-border/70 px-6 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
            <p className="inline-flex items-center gap-2">
              <HeartPulse className="h-3.5 w-3.5 text-primary" />
              © {new Date().getFullYear()} HackRadar. Built in the open.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a href="https://github.com/ZainabTravadi/List-Of-Hackathons/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="hover:text-foreground">
                Contributing
              </a>
              <a href="https://github.com/ZainabTravadi/List-Of-Hackathons/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noreferrer" className="hover:text-foreground">
                Code of Conduct
              </a>
              <a href="https://github.com/ZainabTravadi/List-Of-Hackathons/blob/main/SECURITY.md" target="_blank" rel="noreferrer" className="hover:text-foreground">
                Security
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterColumn = ({ title, links }: { title: string; links: [string, string][] }) => (
  <div>
    <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{title}</h4>
    <ul className="space-y-2 text-sm">
      {links.map(([href, label]) => (
        <li key={href}>
          <Link to={href} className="text-muted-foreground transition-colors hover:text-foreground">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);
