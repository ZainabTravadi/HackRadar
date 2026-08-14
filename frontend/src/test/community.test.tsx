import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

import Leaderboard from "@/pages/Leaderboard";
import Contributors from "@/pages/Contributors";
import type { FellowshipLeaderboardEntry, PublicContributor } from "@/data/community";

const leaderboardState = vi.hoisted(() => ({ data: [] as FellowshipLeaderboardEntry[], isLoading: false, isError: false, refetch: vi.fn() }));
const contributorsState = vi.hoisted(() => ({ data: [] as PublicContributor[], isLoading: false, isError: false, refetch: vi.fn() }));

vi.mock("@/data/community", () => ({
  useLeaderboard: () => leaderboardState,
  useContributors: () => contributorsState,
}));

function renderWithRouter(node: ReactElement) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe("community pages", () => {
  beforeEach(() => {
    leaderboardState.data = [];
    leaderboardState.isLoading = false;
    leaderboardState.isError = false;
    leaderboardState.refetch = vi.fn();
    contributorsState.data = [];
    contributorsState.isLoading = false;
    contributorsState.isError = false;
    contributorsState.refetch = vi.fn();
  });

  it("renders leaderboard podium and scoring explainer", () => {
    leaderboardState.data = [
      {
        rank: 1,
        githubUsername: "alpha",
        displayName: "Alpha Example",
        avatarUrl: "https://example.com/a.png",
        profileUrl: "https://github.com/alpha",
        points: 320,
        mergedPrs: 12,
        easy: 2,
        medium: 3,
        hard: 4,
        expert: 1,
        additions: 1200,
        deletions: 240,
        loc: 1440,
        contributionAreas: ["frontend"],
        firstAwardedAt: "2026-08-01T00:00:00.000Z",
        lastAwardedAt: "2026-08-12T00:00:00.000Z",
      },
      {
        rank: 2,
        githubUsername: "beta",
        displayName: "Beta Example",
        avatarUrl: "https://example.com/b.png",
        profileUrl: "https://github.com/beta",
        points: 285,
        mergedPrs: 10,
        easy: 1,
        medium: 3,
        hard: 3,
        expert: 1,
        additions: 900,
        deletions: 200,
        loc: 1100,
        contributionAreas: ["backend"],
        firstAwardedAt: "2026-08-03T00:00:00.000Z",
        lastAwardedAt: "2026-08-12T00:00:00.000Z",
      },
      {
        rank: 3,
        githubUsername: "gamma",
        displayName: "Gamma Example",
        avatarUrl: "https://example.com/c.png",
        profileUrl: "https://github.com/gamma",
        points: 240,
        mergedPrs: 8,
        easy: 4,
        medium: 2,
        hard: 1,
        expert: 0,
        additions: 700,
        deletions: 120,
        loc: 820,
        contributionAreas: ["documentation"],
        firstAwardedAt: "2026-08-05T00:00:00.000Z",
        lastAwardedAt: "2026-08-11T00:00:00.000Z",
      },
    ];

    renderWithRouter(<Leaderboard />);

    expect(screen.getByText(/Fellowship leaderboard/i)).toBeInTheDocument();
    expect(screen.getAllByText("#1", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /@alpha/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("+5", { selector: "div" })).toBeInTheDocument();
    expect(screen.getByText(/Points are awarded for merged, difficulty-rated work/i)).toBeInTheDocument();
  });

  it("renders empty leaderboard state", () => {
    renderWithRouter(<Leaderboard />);

    expect(screen.getByText(/No Fellowship points yet/i)).toBeInTheDocument();
  });

  it("renders leaderboard error state", () => {
    leaderboardState.isError = true;
    renderWithRouter(<Leaderboard />);

    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
  });

  it("renders leaderboard loading state", () => {
    leaderboardState.isLoading = true;
    renderWithRouter(<Leaderboard />);

    expect(screen.getByText(/Fellowship leaderboard/i)).toBeInTheDocument();
  });

  it("renders contributor cards and fellowship badge", () => {
    contributorsState.data = [
      {
        githubUsername: "alpha",
        displayName: "Alpha Example",
        avatarUrl: "https://example.com/a.png",
        profileUrl: "https://github.com/alpha",
        contributions: 42,
        mergedPrs: 5,
        isFellowshipMember: true,
        contributionAreas: ["frontend", "testing"],
        points: 85,
        rank: 1,
      },
      {
        githubUsername: "bob",
        displayName: "Bob Builder",
        avatarUrl: "https://example.com/b.png",
        profileUrl: "https://github.com/bob",
        contributions: 7,
        mergedPrs: 1,
        isFellowshipMember: false,
        contributionAreas: [],
      },
    ];

    renderWithRouter(<Contributors />);

    expect(screen.getByRole("heading", { name: /The HackRadar contributor directory/i })).toBeInTheDocument();
    expect(screen.getAllByText("HackRadar Contributor", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getByText("HackRadar Fellowship", { selector: "div" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /@alpha/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /@bob/i }).length).toBeGreaterThan(0);
  });

  it("renders contributor empty and error states", () => {
    const emptyRender = renderWithRouter(<Contributors />);
    expect(screen.getByText(/No contributors found yet/i)).toBeInTheDocument();
    emptyRender.unmount();

    contributorsState.isError = true;
    renderWithRouter(<Contributors />);
    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
  });
});
