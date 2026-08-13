import { Link } from "react-router-dom";
import { Radar } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-gradient text-primary-foreground">
                <Radar className="h-4 w-4" />
              </span>
              HackRadar
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              An open-source initiative to make hackathons and technical opportunities easier to discover.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Discover</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/hackathons" className="hover:text-foreground">Hackathons</Link></li>
              <li><Link to="/organizers" className="hover:text-foreground">Organizers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/join" className="hover:text-foreground">Join</Link></li>
              <li><Link to="/contributors" className="hover:text-foreground">Contributors</Link></li>
              <li><Link to="/leaderboard" className="hover:text-foreground">Leaderboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Project</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/transparency" className="hover:text-foreground">Transparency</Link></li>
              <li><Link to="/roadmap" className="hover:text-foreground">Roadmap</Link></li>
              <li><Link to="/governance" className="hover:text-foreground">Governance</Link></li>
              <li><Link to="/impact" className="hover:text-foreground">Impact</Link></li>
              <li><Link to="/docs" className="hover:text-foreground">Docs</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} HackRadar. Built in the open.</p>
          <div className="flex gap-3 flex-wrap">
            <a href="https://github.com/ZainabTravadi/List-Of-Hackathons" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
            <a href="https://github.com/ZainabTravadi/List-Of-Hackathons/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="hover:text-foreground">Contributing</a>
            <a href="https://github.com/ZainabTravadi/List-Of-Hackathons/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noreferrer" className="hover:text-foreground">Code of Conduct</a>
            <a href="https://github.com/ZainabTravadi/List-Of-Hackathons/blob/main/SECURITY.md" target="_blank" rel="noreferrer" className="hover:text-foreground">Security</a>
            <Link to="/api" className="hover:text-foreground">API</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
