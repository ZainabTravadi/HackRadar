import { describe, expect, it } from "vitest";
import { filterHackathons, type Hackathon } from "../data/hackathons";

const sampleHackathons: Hackathon[] = [
  {
    slug: "alpha",
    title: "AI Builders",
    platform: "Devpost",
    description: "An AI-focused hackathon for builders.",
    registrationDeadline: "2030-01-01T00:00:00.000Z",
    submissionDeadline: "2030-01-10T00:00:00.000Z",
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
    mode: "In-person",
    country: "USA",
    prize: "$1,000",
    tags: ["Web3", "Blockchain"],
    organizer: "MLH",
    url: "https://example.com/beta",
    updatedHoursAgo: 2,
  },
];

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

    console.log("filterHackathons result", result.map((hackathon) => hackathon.slug));
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
