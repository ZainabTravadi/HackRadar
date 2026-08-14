import { useEffect, useMemo, useState, type ReactNode } from "react";
import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { HackathonCard } from "@/components/HackathonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useHackathons } from "@/data/hackathons";
import FilterChip from "@/components/ui/FilterChip";

type Props = {
  presetTitle?: string;
  presetSubtitle?: string;
  presetMode?: string;
  presetTheme?: string;
  presetStatus?: string;
  presetCountry?: string;
};

const Hackathons = ({
  presetTitle = "All Hackathons",
  presetSubtitle = "Sorted by closing soonest.",
  presetMode = "all",
  presetTheme = "all",
  presetStatus = "all",
  presetCountry = "all",
}: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [mode, setMode] = useState(searchParams.get("mode") ?? presetMode);
  const [theme, setTheme] = useState(searchParams.get("theme") ?? presetTheme);
  const [status, setStatus] = useState(searchParams.get("status") ?? presetStatus);
  const [country, setCountry] = useState(searchParams.get("country") ?? presetCountry);
  const [sort, setSort] = useState(searchParams.get("sort") ?? "closing");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempMode, setTempMode] = useState(mode);
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempStatus, setTempStatus] = useState(status);
  const [tempCountry, setTempCountry] = useState(country);

  const apiFilters = {
    query: searchParams.get("q") ?? "",
    mode: searchParams.get("mode") ?? presetMode,
    theme: searchParams.get("theme") ?? presetTheme,
    status: searchParams.get("status") ?? presetStatus,
    country: searchParams.get("country") ?? presetCountry,
    sort: searchParams.get("sort") ?? "closing",
  };

  const { data: hackathons = [], isLoading, error, refetch } = useHackathons(apiFilters);

  useEffect(() => {
    const qp = searchParams.get("q") ?? "";
    const m = searchParams.get("mode") ?? presetMode;
    const th = searchParams.get("theme") ?? presetTheme;
    const st = searchParams.get("status") ?? presetStatus;
    const c = searchParams.get("country") ?? presetCountry;
    const s = searchParams.get("sort") ?? "closing";

    if (qp !== query) setQuery(qp);
    if (m !== mode) setMode(m);
    if (th !== theme) setTheme(th);
    if (st !== status) setStatus(st);
    if (c !== country) setCountry(c);
    if (s !== sort) setSort(s);
  }, [searchParams, query, mode, theme, status, country, sort, presetMode, presetTheme, presetStatus, presetCountry]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedQuery) nextParams.set("q", debouncedQuery);
    if (mode !== "all") nextParams.set("mode", mode);
    if (theme !== "all") nextParams.set("theme", theme);
    if (status !== "all") nextParams.set("status", status);
    if (country !== "all") nextParams.set("country", country);
    if (sort !== "closing") nextParams.set("sort", sort);
    setSearchParams(nextParams, { replace: true });
  }, [country, mode, debouncedQuery, setSearchParams, sort, status, theme]);

  const themes = useMemo(() => {
    const values = new Set<string>();
    hackathons.forEach((item) => item.tags.forEach((tag) => values.add(tag)));
    return Array.from(values).sort();
  }, [hackathons]);

  const countries = useMemo(() => {
    const values = new Set<string>();
    hackathons.forEach((item) => item.country && values.add(item.country));
    return Array.from(values).sort();
  }, [hackathons]);

  const activeFilters = [query, mode !== "all", theme !== "all", status !== "all", country !== "all"].filter(Boolean).length;

  const resetFilters = () => {
    setQuery("");
    setMode("all");
    setTheme("all");
    setStatus("all");
    setCountry("all");
    setSort("closing");
  };

  const applySheetFilters = () => {
    setMode(tempMode);
    setTheme(tempTheme);
    setStatus(tempStatus);
    setCountry(tempCountry);
    setSheetOpen(false);
  };

  const quickModes = ["all", "Online", "In-person", "Hybrid"];
  const quickStatuses = ["all", "Open", "Closing Soon", "Ended"];

  return (
    <Layout>
      <section className="section-surface relative overflow-hidden pb-10 pt-12 md:pb-14">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.24]" aria-hidden />
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="container relative">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-success motion-safe:animate-pulse-soft" />
                Radar discovery mode
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
                Your next opportunity is somewhere in this radar.
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
                {presetTitle} is a live, community-curated view of hackathons. Search fast, filter cleanly, and keep an eye on the ones that are closing soon.
              </p>
              <p className="mt-3 text-sm font-medium text-muted-foreground">{presetSubtitle}</p>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, theme, organizer, or keyword..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-14 rounded-full border-border/70 bg-card/80 pl-11 pr-4 shadow-sm backdrop-blur focus-visible:ring-primary"
                />
              </div>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-14 w-full min-w-[180px] rounded-full border-border/70 bg-card/80 backdrop-blur md:w-[180px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closing">Closing soonest</SelectItem>
                  <SelectItem value="newest">Recently updated</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-3 md:flex md:flex-nowrap md:items-center">
                <Button variant="outline" size="sm" onClick={resetFilters} className="h-14 rounded-full border-border/70 bg-card/80 px-4 backdrop-blur">
                  Reset
                </Button>
                <Button variant="outline" size="sm" onClick={() => void refetch()} className="h-14 rounded-full border-border/70 bg-card/80 px-4 backdrop-blur">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {quickModes.map((item) => (
                <FilterChip key={item} active={mode === item} onClick={() => setMode(item)}>
                  {item === "all" ? "All modes" : item}
                </FilterChip>
              ))}
              {quickStatuses.map((item) => (
                <FilterChip key={item} active={status === item} onClick={() => setStatus(item)}>
                  {item === "all" ? "All status" : item}
                </FilterChip>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Showing</span>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-sm font-semibold backdrop-blur">
                {hackathons.length} hackathons
              </span>
              {activeFilters > 0 ? <span className="text-sm text-muted-foreground">({activeFilters} active filters)</span> : null}
            </div>

            <div className="mt-4 md:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <div className="flex items-center gap-2">
                  <SheetTrigger asChild>
                    <Button size="sm" className="w-full rounded-full bg-primary-gradient">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      More filters
                    </Button>
                  </SheetTrigger>
                  <Button size="sm" variant="outline" onClick={resetFilters} className="rounded-full">
                    Clear
                  </Button>
                </div>

                <SheetContent side="bottom" className="rounded-t-[1.5rem] border-border/70 bg-background/98 backdrop-blur-xl">
                  <SheetHeader>
                    <SheetTitle>Filter the radar</SheetTitle>
                  </SheetHeader>
                  <div className="mt-5 space-y-4">
                    <FilterGroup label="Mode">
                      <Select value={tempMode} onValueChange={setTempMode}>
                        <SelectTrigger className="w-full rounded-full">
                          <SelectValue placeholder="Mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All modes</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                          <SelectItem value="In-person">In-person</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterGroup>

                    <FilterGroup label="Theme">
                      <Select value={tempTheme} onValueChange={setTempTheme}>
                        <SelectTrigger className="w-full rounded-full">
                          <SelectValue placeholder="Theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All themes</SelectItem>
                          {themes.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterGroup>

                    <FilterGroup label="Status">
                      <Select value={tempStatus} onValueChange={setTempStatus}>
                        <SelectTrigger className="w-full rounded-full">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All status</SelectItem>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Closing Soon">Closing Soon</SelectItem>
                          <SelectItem value="Ended">Ended</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterGroup>

                    <FilterGroup label="Country">
                      <Select value={tempCountry} onValueChange={setTempCountry}>
                        <SelectTrigger className="w-full rounded-full">
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All countries</SelectItem>
                          {countries.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterGroup>
                  </div>

                  <SheetFooter>
                    <div className="flex w-full gap-2">
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="w-1/2 rounded-full"
                          onClick={() => {
                            setTempMode(mode);
                            setTempTheme(theme);
                            setTempStatus(status);
                            setTempCountry(country);
                          }}
                        >
                          Cancel
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="w-1/2 rounded-full bg-primary-gradient" onClick={applySheetFilters}>
                          Apply
                        </Button>
                      </SheetClose>
                    </div>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container">
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full border border-border/70 bg-card/80 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
              >
                "{query}" x
              </button>
            ) : null}
            {mode !== "all" ? (
              <button type="button" onClick={() => setMode("all")} className="rounded-full border border-border/70 bg-card/80 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                {mode} x
              </button>
            ) : null}
            {theme !== "all" ? (
              <button type="button" onClick={() => setTheme("all")} className="rounded-full border border-border/70 bg-card/80 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                {theme} x
              </button>
            ) : null}
            {status !== "all" ? (
              <button type="button" onClick={() => setStatus("all")} className="rounded-full border border-border/70 bg-card/80 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                {status} x
              </button>
            ) : null}
            {country !== "all" ? (
              <button type="button" onClick={() => setCountry("all")} className="rounded-full border border-border/70 bg-card/80 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                {country} x
              </button>
            ) : null}
          </div>

          <div className="mt-8">
            <p className="mb-5 text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{hackathons.length}</span> hackathons
            </p>

            {isLoading ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-card/70 p-16 text-center text-muted-foreground">
                Loading live hackathons...
              </div>
            ) : error ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-card/70 p-16 text-center text-muted-foreground">
                Failed to load live hackathons.
              </div>
            ) : hackathons.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-card/70 p-16 text-center">
                <p className="text-muted-foreground">No hackathons match these filters.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {hackathons.map((item) => (
                  <HackathonCard key={item.slug} h={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

const FilterGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <div className="mb-2 text-sm font-medium text-muted-foreground">{label}</div>
    {children}
  </div>
);

export default Hackathons;
