import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Hackathons from "../pages/Hackathons";

vi.mock("../data/hackathons", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/hackathons")>();
  return {
    ...actual,
    useHackathons: () => ({
      data: [
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
});
