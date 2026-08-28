import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import Hackathons from "../pages/Hackathons";

const mockState = vi.hoisted(() => ({ empty: false }));

vi.mock("../data/hackathons", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/hackathons")>();
  return {
    ...actual,
    useHackathons: () => ({
      data: mockState.empty ? [] : [
        {
          slug: "alpha",
          title: "Alpha Hackathon",
          platform: "Devpost",
          description: "A test hackathon.",
          imageUrl: null,
          registrationDeadline: "2030-01-01T00:00:00.000Z",
          submissionDeadline: null,
          eventEndDate: null,
          mode: "Online" as const,
          status: "Open" as const,
          tags: ["AI"],
          organizer: "Devpost",
          url: "https://example.com/alpha",
          updatedHoursAgo: 1,
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }),
  };
});

describe("Hackathons sorting control", () => {
  afterEach(() => {
    mockState.empty = false;
  });

  it("exposes all supported sorting options with an accessible label", () => {
    render(
      <MemoryRouter>
        <Hackathons />
      </MemoryRouter>,
    );

    const sortControl = screen.getByRole("combobox", { name: "Sort by" });
    expect(sortControl).toBeInTheDocument();

    fireEvent.click(sortControl);

    expect(screen.getByRole("option", { name: "Deadline: Soonest first" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Deadline: Latest first" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Name: A-Z" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Name: Z-A" })).toBeInTheDocument();
  });

  it("shows normal results when hackathons are available", () => {
    render(
      <MemoryRouter>
        <Hackathons />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "View Alpha Hackathon hackathon details" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No hackathons found" })).not.toBeInTheDocument();
  });

  it("clears the active search and filters from the empty state", async () => {
    mockState.empty = true;
    render(
      <MemoryRouter initialEntries={["/hackathons?q=missing"]}>
        <Hackathons />
      </MemoryRouter>,
    );

    const search = screen.getByPlaceholderText("Search by title, theme, organizer, or keyword...");
    fireEvent.change(search, { target: { value: "missing" } });
    expect(search).toHaveValue("missing");
    mockState.empty = false;
    fireEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));

    await waitFor(() => {
      expect(search).toHaveValue("");
      expect(screen.getByRole("link", { name: "View Alpha Hackathon hackathon details" })).toBeInTheDocument();
    });
  });

  it("shows the empty state for a search result with no matches", () => {
    mockState.empty = true;
    render(
      <MemoryRouter initialEntries={["/hackathons?q=missing"]}>
        <Hackathons />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "No hackathons found" })).toBeInTheDocument();
    expect(screen.getByText(/No hackathons matched your current search or filters/i)).toBeInTheDocument();
  });

  it("shows the empty state for a filter result with no matches", () => {
    mockState.empty = true;
    render(
      <MemoryRouter initialEntries={["/hackathons?mode=In-person"]}>
        <Hackathons />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "No hackathons found" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search and filters" })).toBeInTheDocument();
  });
});
