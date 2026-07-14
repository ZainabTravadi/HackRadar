import { computeHackathonStatus, resolveHackathonDeadline } from "../../../backend/src/pipeline/status";
import { useQuery } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:3001";

export type Platform = string;
export type Mode = "Online" | "In-person" | "Hybrid" | "Unknown";
export type Status = "Open" | "Closing Soon" | "Ended";

export interface Hackathon {
  slug: string;
  title: string;
  platform: Platform;
  description: string;
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

export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "Deadline TBA";
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "Deadline TBA";
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

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

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchHackathons(): Promise<Hackathon[]> {
  const rows = await fetchJson<ApiHackathon[]>("/api/hackathons");
  return rows.map(toHackathon).filter((row) => getStatus(row) !== "Ended");
}

export async function fetchHackathon(slug: string): Promise<Hackathon | null> {
  const row = await fetchJson<ApiHackathon>(`/api/hackathons/${encodeURIComponent(slug)}`);
  return row ? toHackathon(row) : null;
}

export function useHackathons() {
  return useQuery({
    queryKey: ["hackathons"],
    queryFn: fetchHackathons,
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
