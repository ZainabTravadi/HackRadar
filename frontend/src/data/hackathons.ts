import { useQuery } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";
import { formatHackathonDate } from "@/lib/date";
import { computeHackathonStatus, resolveHackathonDeadline } from "@/lib/hackathonStatus";

export type Platform = string;
export type Mode = "Online" | "In-person" | "Hybrid" | "Unknown";
export type Status = "Open" | "Closing Soon" | "Ended";

export interface Hackathon {
  slug: string;
  title: string;
  platform: Platform;
  description: string;
  imageUrl?: string | null;
  registrationDeadline: string | null;
  submissionDeadline: string | null;
  eventEndDate: string | null;
  mode: Mode;
  status: Status;
  country?: string;
  prize?: string;
  tags: string[];
  organizer: string;
  url: string;
  updatedHoursAgo: number;
}

type ApiHackathon = {
  slug: string;
  title: string;
  platform: string;
  description: string;
  imageUrl?: string | null;
  registrationDeadline: string | null;
  submissionDeadline: string | null;
  eventEndDate: string | null;
  mode: Mode;
  status: "open" | "closing-soon" | "ended" | "upcoming";
  country?: string;
  prize?: string;
  tags: string[];
  organizer: string;
  url: string;
  updatedHoursAgo: number;
};

type DeadlineFields = Pick<Hackathon, "registrationDeadline" | "submissionDeadline" | "eventEndDate">;

export const getDaysUntil = (iso: string | null | undefined) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

export const getDeadlineInfo = (h: DeadlineFields) => {
  const deadline = resolveHackathonDeadline({
    registrationDeadline: h.registrationDeadline,
    submissionDeadline: h.submissionDeadline,
    eventEndDate: h.eventEndDate,
  });
  const status = computeDisplayStatus(h);

  if (!deadline) {
    return {
      deadline: null as Date | null,
      days: null as number | null,
      status,
      label: "Deadline TBA",
    };
  }

  const days = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  return {
    deadline,
    days,
    status,
    label: status === "Ended" ? "Ended" : `Closes in ${days}d`,
  };
};

export const getStatus = (h: DeadlineFields): Status => getDeadlineInfo(h).status;

export const formatDate = (iso: string | null | undefined) => formatHackathonDate(iso);

export interface HackathonFilters {
  query: string;
  mode: string;
  theme: string;
  status: string;
  country: string;
  sort: string;
}

function matchesSearchQuery(value: string, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const normalizedValue = value.toLowerCase();

  return terms.every((term) => {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`, "i").test(normalizedValue);
  });
}

export function filterHackathons(hackathons: Hackathon[], filters: HackathonFilters): Hackathon[] {
  let list = hackathons.filter((h) => {
    const matchesQuery = [
      h.title,
      h.description,
      h.organizer,
      ...(h.tags ?? []),
    ].some((value) => matchesSearchQuery(value, filters.query));

    if (!matchesQuery) {
      return false;
    }

    if (filters.mode !== "all" && h.mode !== filters.mode) return false;
    if (filters.theme !== "all" && !h.tags.some((tag) => tag.toLowerCase() === filters.theme.toLowerCase())) return false;
    if (filters.country !== "all" && h.country !== filters.country) return false;
    if (filters.status !== "all" && getStatus(h) !== filters.status) return false;

    return true;
  });

  if (filters.sort === "closing") {
    list = list.sort((a, b) => {
      const aDays = getDeadlineInfo(a).days ?? Number.POSITIVE_INFINITY;
      const bDays = getDeadlineInfo(b).days ?? Number.POSITIVE_INFINITY;
      return aDays - bDays;
    });
  } else if (filters.sort === "newest") {
    list = list.sort((a, b) => a.updatedHoursAgo - b.updatedHoursAgo);
  }

  return list;
}

export async function fetchHackathons(filters?: Partial<HackathonFilters>): Promise<Hackathon[]> {
  const qs = new URLSearchParams();
  if (filters) {
    if (filters.query) qs.set("q", filters.query);
    if (filters.mode && filters.mode !== "all") qs.set("mode", filters.mode);
    if (filters.theme && filters.theme !== "all") qs.set("theme", filters.theme);
    if (filters.status && filters.status !== "all") qs.set("status", filters.status);
    if (filters.country && filters.country !== "all") qs.set("country", filters.country);
    if (filters.sort) qs.set("sort", filters.sort);
  }

  const path = `/api/hackathons${qs.toString() ? `?${qs.toString()}` : ""}`;
  const rows = await apiFetchJson<ApiHackathon[]>(path);
  return rows.map(toHackathon);
}

export async function fetchHackathon(slug: string): Promise<Hackathon | null> {
  const row = await apiFetchJson<ApiHackathon>(`/api/hackathons/${encodeURIComponent(slug)}`);
  return row ? toHackathon(row) : null;
}

export function useHackathons(filters?: Partial<HackathonFilters>) {
  return useQuery({
    queryKey: ["hackathons", filters ?? {}],
    queryFn: () => fetchHackathons(filters),
    staleTime: 60_000,
  });
}

export function useHackathon(slug?: string) {
  return useQuery({
    queryKey: ["hackathon", slug],
    queryFn: async () => (slug ? fetchHackathon(slug) : null),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

function toHackathon(row: ApiHackathon): Hackathon {
  const status = computeDisplayStatus({
    registrationDeadline: row.registrationDeadline,
    submissionDeadline: row.submissionDeadline,
    eventEndDate: row.eventEndDate,
  });

  return {
    slug: row.slug,
    title: row.title,
    platform: row.platform,
    description: row.description,
    imageUrl: row.imageUrl ?? null,
    registrationDeadline: row.registrationDeadline,
    submissionDeadline: row.submissionDeadline,
    eventEndDate: row.eventEndDate,
    mode: row.mode,
    status,
    country: row.country,
    prize: row.prize,
    tags: row.tags ?? [],
    organizer: row.organizer,
    url: row.url,
    updatedHoursAgo: row.updatedHoursAgo,
  };
}

function computeDisplayStatus(dates: DeadlineFields): Status {
  const status = computeHackathonStatus({
    registrationDeadline: dates.registrationDeadline,
    submissionDeadline: dates.submissionDeadline,
    eventEndDate: dates.eventEndDate,
  });

  if (status === "ended") return "Ended";
  if (status === "closing_soon") return "Closing Soon";
  return "Open";
}
