import { Link } from "react-router-dom";
import { Radar } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-gradient text-primary-foreground">
                <Radar className="h-4 w-4" />
              </span>
              HackRadar
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Real-time hackathon aggregator. Find hackathons before deadlines close.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/hackathons" className="hover:text-foreground">Hackathons</Link></li>
              <li><Link to="/hackathons/closing-soon" className="hover:text-foreground">Closing Soon</Link></li>
              <li><Link to="/submit" className="hover:text-foreground">Submit Hackathon</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Developers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/api" className="hover:text-foreground">API</Link></li>
              <li><a href="https://github.com" className="hover:text-foreground">GitHub</a></li>
              <li><Link to="/hackathons/ai" className="hover:text-foreground">AI Hackathons</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} HackRadar. Built for builders.</p>
          <p>Aggregating Devpost · MLH · Unstop · Devfolio</p>
        </div>
      </div>
    </footer>
  );
};
