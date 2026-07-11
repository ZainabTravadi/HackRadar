import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Layout } from "@/components/Layout";
import { HackathonCard } from "@/components/HackathonCard";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useHackathons, getStatus, getDaysUntil } from "@/data/hackathons";

interface Props {
  presetTitle?: string;
  presetSubtitle?: string;
  presetMode?: string;
  presetTheme?: string;
  presetStatus?: string;
  presetCountry?: string;
}

const Hackathons = ({
  presetTitle = "All Hackathons",
  presetSubtitle = "500+ hackathons, sorted by closing soonest.",
  presetMode = "all",
  presetTheme = "all",
  presetStatus = "all",
  presetCountry = "all",
}: Props) => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState(presetMode);
  const [theme, setTheme] = useState(presetTheme);
  const [status, setStatus] = useState(presetStatus);
  const [country, setCountry] = useState(presetCountry);
  const [sort, setSort] = useState("closing");
  const { data: hackathons = [], isLoading, error } = useHackathons();

  const themes = useMemo(() => {
    const s = new Set<string>();
    hackathons.forEach((h) => h.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, []);

  const countries = useMemo(() => {
    const s = new Set<string>();
    hackathons.forEach((h) => h.country && s.add(h.country));
    return Array.from(s).sort();
  }, []);

  const filtered = useMemo(() => {
    let list = hackathons.filter((h) => {
      if (query && !h.title.toLowerCase().includes(query.toLowerCase()) && !h.description.toLowerCase().includes(query.toLowerCase())) return false;
      if (mode !== "all" && h.mode !== mode) return false;
      if (theme !== "all" && !h.tags.includes(theme)) return false;
      if (country !== "all" && h.country !== country) return false;
      if (status !== "all" && getStatus(h) !== status) return false;
      return true;
    });
    if (sort === "closing") {
      list = list.sort((a, b) => getDaysUntil(a.registrationDeadline) - getDaysUntil(b.registrationDeadline));
    } else if (sort === "newest") {
      list = list.sort((a, b) => a.updatedHoursAgo - b.updatedHoursAgo);
    }
    return list;
  }, [query, mode, theme, status, country, sort]);

  return (
    <Layout>
      <section className="bg-hero-gradient pb-12 pt-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              {presetTitle}
            </h1>
            <p className="mt-3 text-muted-foreground">{presetSubtitle}</p>

            <div className="relative mt-8">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, theme, or organizer…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 rounded-full border-border bg-card pl-11 pr-4 shadow-card focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-[140px] rounded-full"><SelectValue placeholder="Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="In-person">In-person</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[140px] rounded-full"><SelectValue placeholder="Theme" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All themes</SelectItem>
                {themes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px] rounded-full"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closing Soon">Closing Soon</SelectItem>
                <SelectItem value="Ended">Ended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[150px] rounded-full"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[170px] rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="closing">Closing Soonest</SelectItem>
                  <SelectItem value="newest">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> hackathons
          </p>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
              Loading live hackathons...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
              Failed to load live hackathons.
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <p className="text-muted-foreground">No hackathons match these filters.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((h) => <HackathonCard key={h.slug} h={h} />)}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Hackathons;
