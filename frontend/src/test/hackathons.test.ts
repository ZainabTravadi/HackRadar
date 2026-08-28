import { describe, expect, it } from "vitest";
import { filterHackathons, type Hackathon } from "../data/hackathons";
import { formatHackathonDate } from "@/lib/date";

const sampleHackathons: Hackathon[] = [
  {
    slug: "alpha",
    title: "AI Builders",
    platform: "Devpost",
    description: "An AI-focused hackathon for builders.",
    registrationDeadline: "2030-01-01T00:00:00.000Z",
    submissionDeadline: "2030-01-10T00:00:00.000Z",
    eventEndDate: null,
    mode: "Online",
    country: "India",
    prize: "$500",
    tags: ["AI", "ML"],
    organizer: "Devpost",
    url: "https://example.com/alpha",
    updatedHoursAgo: 4,
  },
  {
    slug: "beta",
    title: "Web3 Sprint",
    platform: "MLH",
    description: "A blockchain-focused sprint.",
    registrationDeadline: "2025-01-15T00:00:00.000Z",
    submissionDeadline: "2025-01-20T00:00:00.000Z",
    eventEndDate: null,
    mode: "In-person",
    country: "USA",
    prize: "$1,000",
    tags: ["Web3", "Blockchain"],
    organizer: "MLH",
    url: "https://example.com/beta",
    updatedHoursAgo: 2,
  },
];

describe("formatHackathonDate", () => {
  it("formats a valid UTC date using the project display format", () => {
    expect(formatHackathonDate("2026-08-28T00:00:00.000Z")).toBe("Aug 28, 2026");
  });

  it("formats a date with a time component without drifting across timezone boundaries", () => {
    expect(formatHackathonDate("2026-08-28T18:45:00.000Z")).toBe("Aug 28, 2026");
  });

  it("returns a fallback for missing or empty values", () => {
    expect(formatHackathonDate(null)).toBe("Date unavailable");
    expect(formatHackathonDate(undefined)).toBe("Date unavailable");
    expect(formatHackathonDate("   ")).toBe("Date unavailable");
  });

  it("returns a fallback for invalid dates", () => {
    expect(formatHackathonDate("not-a-date")).toBe("Date unavailable");
    expect(formatHackathonDate("2026-02-30T00:00:00.000Z")).toBe("Date unavailable");
  });

  it("preserves the calendar day for UTC timestamps near timezone boundaries", () => {
    expect(formatHackathonDate("2026-12-31T23:30:00.000Z")).toBe("Dec 31, 2026");
    expect(formatHackathonDate("2026-01-01T00:30:00.000Z")).toBe("Jan 1, 2026");
  });
});

describe("filterHackathons", () => {
  it("filters and sorts live hackathon data correctly", () => {
    const result = filterHackathons(sampleHackathons, {
      query: "ai",
      mode: "all",
      theme: "all",
      status: "all",
      country: "all",
      sort: "closing",
    });

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("alpha");
  });

  it("returns the newest hackathons when newest sorting is requested", () => {
    const result = filterHackathons(sampleHackathons, {
      query: "",
      mode: "all",
      theme: "all",
      status: "all",
      country: "all",
      sort: "newest",
    });

    expect(result[0].slug).toBe("beta");
  });
});
