import { useQuery } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type ContributionDifficulty = "easy" | "medium" | "hard" | "expert";

export type PublicContributor = {
  githubUsername: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
  mergedPrs: number;
  isFellowshipMember: boolean;
  contributionAreas: string[];
  points?: number;
  rank?: number;
};

export type FellowshipLeaderboardEntry = {
  rank: number;
  githubUsername: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  points: number;
  mergedPrs: number;
  easy: number;
  medium: number;
  hard: number;
  expert: number;
  additions: number;
  deletions: number;
  loc: number;
  contributionAreas: string[];
  firstAwardedAt: string;
  lastAwardedAt: string;
};

export type ContributorProfile = {
  githubUsername: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
  mergedPrs: number;
  isFellowshipMember: boolean;
  points?: number;
  rank?: number;
  easy?: number;
  medium?: number;
  hard?: number;
  expert?: number;
  additions?: number;
  deletions?: number;
  loc?: number;
  contributionAreas: string[];
};

type ApiCollection<T> = {
  updatedAt: string;
  contributors?: T[];
  leaderboard?: T[];
};

type ApiContributorProfile = {
  updatedAt: string;
  contributor: ContributorProfile | null;
};

export async function fetchContributors(): Promise<PublicContributor[]> {
  const response = await apiFetchJson<ApiCollection<PublicContributor>>("/api/contributors");
  return response.contributors ?? [];
}

export async function fetchLeaderboard(): Promise<FellowshipLeaderboardEntry[]> {
  const response = await apiFetchJson<ApiCollection<FellowshipLeaderboardEntry>>("/api/fellowship/leaderboard");
  return response.leaderboard ?? [];
}

export async function fetchContributorProfile(username: string): Promise<ContributorProfile | null> {
  const response = await apiFetchJson<ApiContributorProfile>(`/api/fellowship/contributors/${encodeURIComponent(username)}`);
  return response.contributor ?? null;
}

export function useContributors() {
  return useQuery({
    queryKey: ["community", "contributors"],
    queryFn: fetchContributors,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["community", "leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 5 * 60 * 1000,
  });
}

export function useContributorProfile(username?: string) {
  return useQuery({
    queryKey: ["community", "contributor", username],
    queryFn: () => (username ? fetchContributorProfile(username) : Promise.resolve(null)),
    enabled: Boolean(username),
    staleTime: 5 * 60 * 1000,
  });
}
