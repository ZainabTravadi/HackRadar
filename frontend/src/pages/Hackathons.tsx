import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { HackathonCard } from "@/components/HackathonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useHackathons } from "@/data/hackathons";
import FilterChip from "@/components/ui/FilterChip";

const Hackathons = ({
  presetTitle = "All Hackathons",
  presetSubtitle = "500+ hackathons, sorted by closing soonest.",
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

  const apiFilters = {
    query: searchParams.get("q") ?? "",
    mode: searchParams.get("mode") ?? presetMode,
    theme: searchParams.get("theme") ?? presetTheme,
    status: searchParams.get("status") ?? presetStatus,
    country: searchParams.get("country") ?? presetCountry,
    sort: searchParams.get("sort") ?? "closing",
  };

  const { data: hackathons = [], isLoading, error, refetch } = useHackathons(apiFilters);

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempMode, setTempMode] = useState(mode);
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempStatus, setTempStatus] = useState(status);
  const [tempCountry, setTempCountry] = useState(country);

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

  return (
    <Layout>
      <section className="bg-hero-gradient pb-12 pt-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">{presetTitle}</h1>
            <p className="mt-3 text-muted-foreground">{presetSubtitle}</p>

            <div className="relative mt-8">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, theme, or organizer..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 rounded-full border-border bg-card pl-11 pr-4 shadow-card focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="mt-4 md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <div className="flex items-center justify-between">
                <SheetTrigger asChild>
                  <Button size="sm" className="w-full">
                    Filters
                  </Button>
                </SheetTrigger>
                <div className="ml-2">
                  <Button size="sm" variant="outline" onClick={resetFilters}>
                    Clear
                  </Button>
                </div>
              </div>

              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 text-sm font-medium">Mode</div>
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
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">Theme</div>
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
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">Status</div>
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
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">Country</div>
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
                  </div>
                </div>

                <SheetFooter>
                  <div className="flex w-full gap-2">
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        className="w-1/2"
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
                      <Button className="w-1/2" onClick={applySheetFilters}>
                        Apply filters
                      </Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <div className="flex w-full items-center gap-3 md:w-auto">
              <span className="text-sm font-medium text-muted-foreground">Filters:</span>
              <div className="flex flex-wrap items-center gap-2">
                {!query && mode === "all" && theme === "all" && status === "all" && country === "all" ? (
                  <span className="text-sm text-muted-foreground">None</span>
                ) : (
                  <>
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                      >
                        "{query}" ×
                      </button>
                    ) : null}
                    {mode !== "all" ? (
                      <button
                        type="button"
                        onClick={() => setMode("all")}
                        className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                      >
                        {mode} ×
                      </button>
                    ) : null}
                    {theme !== "all" ? (
                      <button
                        type="button"
                        onClick={() => setTheme("all")}
                        className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                      >
                        {theme} ×
                      </button>
                    ) : null}
                    {status !== "all" ? (
                      <button
                        type="button"
                        onClick={() => setStatus("all")}
                        className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                      >
                        {status} ×
                      </button>
                    ) : null}
                    {country !== "all" ? (
                      <button
                        type="button"
                        onClick={() => setCountry("all")}
                        className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                      >
                        {country} ×
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-[140px] rounded-full">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="In-person">In-person</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[140px] rounded-full">
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

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px] rounded-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closing Soon">Closing Soon</SelectItem>
                <SelectItem value="Ended">Ended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[150px] rounded-full">
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

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Refresh
              </Button>
              <span className="text-sm text-muted-foreground">Sort</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[170px] rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closing">Closing Soonest</SelectItem>
                  <SelectItem value="newest">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{hackathons.length}</span> hackathons
          </p>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
              Loading live hackathons...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
              Failed to load live hackathons.
            </div>
          ) : hackathons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <p className="text-muted-foreground">No hackathons match these filters.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {hackathons.map((item) => (
                <HackathonCard key={item.slug} h={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Hackathons;
