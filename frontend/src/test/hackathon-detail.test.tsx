import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import HackathonDetail from "../pages/HackathonDetail";

const mockHackathon = {
  slug: "ai-builders",
  title: "AI Builders",
  platform: "Devpost",
  description: "An AI-focused hackathon for builders.",
  imageUrl: null,
  registrationDeadline: "2030-01-01T00:00:00.000Z",
  submissionDeadline: "2030-01-10T00:00:00.000Z",
  eventEndDate: null,
  mode: "Online" as const,
  status: "Open" as const,
  country: "India",
  prize: "$500",
  tags: ["AI"],
  organizer: "Devpost",
  url: "https://devpost.com/hackathons/ai-builders",
  updatedHoursAgo: 4,
};

vi.mock("../data/hackathons", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/hackathons")>();
  return {
    ...actual,
    useHackathon: () => ({ data: mockHackathon, isLoading: false, error: null }),
  };
});

describe("HackathonDetail copy link action", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("copies the current HackRadar URL and shows success feedback", async () => {
    window.history.replaceState({}, "", "/h/ai-builders");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(
      <MemoryRouter initialEntries={["/h/ai-builders"]}>
        <HackathonDetail />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy Link" }));
    });

    expect(writeText).toHaveBeenCalledWith("http://localhost:3000/h/ai-builders");
    expect(await screen.findByRole("button", { name: "Link Copied" })).toBeInTheDocument();
    expect(screen.getByText("HackRadar link copied to your clipboard.")).toBeInTheDocument();
  });

  it("shows an accessible failure message when clipboard writing fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Clipboard unavailable"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(
      <MemoryRouter initialEntries={["/h/ai-builders"]}>
        <HackathonDetail />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy Link" }));
    });

    expect(await screen.findByRole("button", { name: "Copy Failed" })).toBeInTheDocument();
    expect(screen.getByText("Unable to copy the link. Please copy the page address manually.")).toBeInTheDocument();
  });

  it("keeps the official source link separate from the copied HackRadar link", () => {
    render(
      <MemoryRouter initialEntries={["/h/ai-builders"]}>
        <HackathonDetail />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Visit Official Site/i })).toHaveAttribute("href", mockHackathon.url);
    expect(screen.getByRole("button", { name: "Copy Link" })).toHaveAttribute("aria-describedby", "copy-link-status");
  });
});
