import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Index from "@/pages/Index";
import type { Hackathon } from "@/data/hackathons";

const sampleHackathon: Hackathon = {
  slug: "alpha",
  title: "Alpha Hackathon",
  platform: "Devpost",
  description: "A test hackathon for the homepage.",
  imageUrl: null,
  registrationDeadline: "2030-01-01T00:00:00.000Z",
  submissionDeadline: null,
  eventEndDate: null,
  mode: "Online",
  status: "Open",
  country: "India",
  prize: "$1,000",
  tags: ["AI"],
  organizer: "Devpost",
  url: "https://example.com/alpha",
  updatedHoursAgo: 1,
};

const homepageState = vi.hoisted(() => ({
  data: [] as Hackathon[],
  isLoading: false,
  isError: false,
  error: null as Error | null,
  refetch: vi.fn(),
}));

vi.mock("@/data/hackathons", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/data/hackathons")>();
  return {
    ...actual,
    useHackathons: () => homepageState,
  };
});

function renderHomepage() {
  return render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>,
  );
}

describe("Homepage hackathon states", () => {
  beforeEach(() => {
    homepageState.data = [];
    homepageState.isLoading = false;
    homepageState.isError = false;
    homepageState.error = null;
    homepageState.refetch = vi.fn();
  });

  it("renders hackathon cards for the successful state", () => {
    homepageState.data = [sampleHackathon];
    renderHomepage();

    expect(screen.getByRole("link", { name: "View Alpha Hackathon hackathon details" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading hackathons...")).not.toBeInTheDocument();
  });

  it("keeps the existing loading state", () => {
    homepageState.isLoading = true;
    renderHomepage();

    expect(screen.getByText("Loading hackathons...")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an accessible error state instead of the empty state when the request fails", () => {
    homepageState.isError = true;
    renderHomepage();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/failed to load live hackathons/i);
    expect(alert).toHaveTextContent(/could not be loaded right now/i);
    expect(screen.queryByText(/No hackathons available right now/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("treats a hook error object as an error state", () => {
    homepageState.error = new Error("request failed");
    renderHomepage();

    expect(screen.getByRole("alert")).toHaveTextContent(/failed to load live hackathons/i);
  });

  it("calls refetch when the Retry button is clicked", () => {
    homepageState.isError = true;
    renderHomepage();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(homepageState.refetch).toHaveBeenCalledTimes(1);
  });

  it("does not claim events are being indexed when the request fails", () => {
    homepageState.isError = true;
    renderHomepage();

    expect(screen.getByText(/Live index unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/events indexed/i)).not.toBeInTheDocument();
  });
});
