import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HackathonCard } from "../components/HackathonCard";
import { HackathonImage } from "../components/HackathonImage";
import { filterHackathons, sortHackathons, type Hackathon } from "../data/hackathons";
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

describe("hackathon image fallback", () => {
  it("renders a valid image url normally with accessible alt text", () => {
    render(createElement(HackathonImage, { src: "https://example.com/hackathon.png", alt: "AI Builders promotional image" }));

    expect(screen.getByRole("img", { name: /AI Builders promotional image/i })).toBeInTheDocument();
  });

  it("replaces broken image URLs with the fallback state", () => {
    render(createElement(HackathonImage, { src: "https://example.com/broken.png", alt: "AI Builders promotional image" }));

    const image = screen.getByRole("img", { name: /AI Builders promotional image/i });
    fireEvent.error(image);

    expect(screen.getByRole("img", { name: /Hackathon image unavailable/i })).toBeInTheDocument();
  });

  it("shows the fallback when the image URL is missing or empty", () => {
    const { rerender } = render(createElement(HackathonImage, { src: null, alt: "AI Builders promotional image" }));
    expect(screen.getByRole("img", { name: /Hackathon image unavailable/i })).toBeInTheDocument();

    rerender(createElement(HackathonImage, { src: "", alt: "AI Builders promotional image" }));
    expect(screen.getByRole("img", { name: /Hackathon image unavailable/i })).toBeInTheDocument();
  });

  it("uses the same fallback in the hackathon card layout", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(HackathonCard, {
          h: {
            slug: "alpha",
            title: "AI Builders",
            platform: "Devpost",
            description: "An AI-focused hackathon for builders.",
            registrationDeadline: "2030-01-01T00:00:00.000Z",
            submissionDeadline: "2030-01-10T00:00:00.000Z",
            eventEndDate: null,
            mode: "Online",
            status: "Open",
            country: "India",
            prize: "$500",
            tags: ["AI"],
            organizer: "Devpost",
            url: "https://example.com/alpha",
            updatedHoursAgo: 4,
            imageUrl: null,
          },
        }),
      ),
    );

    expect(screen.getByRole("img", { name: /Hackathon image unavailable/i })).toBeInTheDocument();
  });
});

describe("hackathon card accessibility", () => {
  it("provides a named keyboard-reachable card link, image alt text, and visible focus styles", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(HackathonCard, {
          h: {
            ...sampleHackathons[0],
            imageUrl: "https://example.com/ai-builders.png",
          },
        }),
      ),
    );

    const cardLink = screen.getByRole("link", { name: "View AI Builders hackathon details" });
    expect(cardLink).toHaveAttribute("href", "/h/alpha");
    expect(cardLink).toHaveClass("focus-visible:outline-none", "focus-visible:ring-2");
    expect(screen.getByRole("img", { name: "AI Builders promotional image" })).toBeInTheDocument();
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

describe("sortHackathons", () => {
  const items = [
    { ...sampleHackathons[0], slug: "zeta", title: "zeta", registrationDeadline: "2030-03-01T00:00:00.000Z" },
    { ...sampleHackathons[1], slug: "alpha", title: "Alpha", registrationDeadline: "2030-01-01T00:00:00.000Z" },
    { ...sampleHackathons[0], slug: "missing", title: "middle", description: "A different event.", tags: ["Other"], registrationDeadline: null, submissionDeadline: null },
  ];

  it("sorts deadlines soonest first and leaves missing deadlines last", () => {
    expect(sortHackathons(items, "closing").map((item) => item.slug)).toEqual(["alpha", "zeta", "missing"]);
  });

  it("sorts deadlines latest first", () => {
    expect(sortHackathons(items, "deadline-latest").map((item) => item.slug)).toEqual(["zeta", "alpha", "missing"]);
  });

  it("sorts names case-insensitively in both directions", () => {
    expect(sortHackathons(items, "name-asc").map((item) => item.slug)).toEqual(["alpha", "missing", "zeta"]);
    expect(sortHackathons(items, "name-desc").map((item) => item.slug)).toEqual(["zeta", "missing", "alpha"]);
  });

  it("preserves default ordering and does not mutate the input array", () => {
    const original = [...items];
    expect(sortHackathons(items, "")).toBe(items);
    expect(items).toEqual(original);
    expect(sortHackathons(items, "name-asc")).not.toBe(items);
    expect(items).toEqual(original);
  });

  it("applies filtering before sorting", () => {
    const result = filterHackathons(items, {
      query: "AI",
      mode: "all",
      theme: "all",
      status: "all",
      country: "all",
      sort: "name-asc",
    });

    expect(result.map((item) => item.slug)).toEqual(["zeta"]);
  });
});
