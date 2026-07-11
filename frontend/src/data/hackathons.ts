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
  registrationDeadline: string;
  submissionDeadline: string;
  mode: Mode;
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
  registrationDeadline: string;
  submissionDeadline: string;
  mode: Mode;
  country?: string;
  prize?: string;
  tags: string[];
  organizer: string;
  url: string;
  updatedHoursAgo: number;
};

export const getDaysUntil = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

export const getStatus = (h: Hackathon): Status => {
  const days = getDaysUntil(h.registrationDeadline);
  if (days <= 0) return "Ended";
  if (days <= 3) return "Closing Soon";
  return "Open";
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchHackathons(): Promise<Hackathon[]> {
  const rows = await fetchJson<ApiHackathon[]>("/api/hackathons");
  return rows.map(toHackathon);
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
  return {
    slug: row.slug,
    title: row.title,
    platform: row.platform,
    description: row.description,
    registrationDeadline: row.registrationDeadline,
    submissionDeadline: row.submissionDeadline,
    mode: row.mode,
    country: row.country,
    prize: row.prize,
    tags: row.tags ?? [],
    organizer: row.organizer,
    url: row.url,
    updatedHoursAgo: row.updatedHoursAgo,
  };
}
