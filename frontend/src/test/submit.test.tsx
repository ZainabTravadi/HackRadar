import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import Submit from "@/pages/Submit";

function renderSubmit() {
  return render(
    <MemoryRouter>
      <Submit />
    </MemoryRouter>,
  );
}

describe("Submit page form labels", () => {
  it("associates every visible label with its control", () => {
    renderSubmit();

    expect(screen.getByLabelText("Title")).toHaveAttribute("id", "submit-title");
    expect(screen.getByLabelText("Link")).toHaveAttribute("id", "submit-link");
    expect(screen.getByLabelText("Platform")).toHaveAttribute("id", "submit-platform");
    expect(screen.getByLabelText("Mode")).toHaveAttribute("id", "submit-mode");
    expect(screen.getByLabelText("Registration Deadline")).toHaveAttribute(
      "id",
      "submit-registration-deadline",
    );
    expect(screen.getByLabelText("Description")).toHaveAttribute("id", "submit-description");
  });

  it("gives the platform and mode selectors accessible names", () => {
    renderSubmit();

    expect(screen.getByRole("combobox", { name: "Platform" })).toHaveAttribute(
      "id",
      "submit-platform",
    );
    expect(screen.getByRole("combobox", { name: "Mode" })).toHaveAttribute("id", "submit-mode");
  });

  it("keeps the existing required validation on the text fields", () => {
    renderSubmit();

    expect(screen.getByLabelText("Title")).toBeRequired();
    expect(screen.getByLabelText("Link")).toBeRequired();
    expect(screen.getByLabelText("Registration Deadline")).toBeRequired();
    expect(screen.getByLabelText("Description")).toBeRequired();
  });

  it("keeps the existing input types for the link and deadline fields", () => {
    renderSubmit();

    expect(screen.getByLabelText("Link")).toHaveAttribute("type", "url");
    expect(screen.getByLabelText("Registration Deadline")).toHaveAttribute("type", "date");
  });

  it("submits successfully when the required fields are filled", () => {
    renderSubmit();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Global AI Summit Hack" },
    });
    fireEvent.change(screen.getByLabelText("Link"), {
      target: { value: "https://example.com/global-ai-summit" },
    });
    fireEvent.change(screen.getByLabelText("Registration Deadline"), {
      target: { value: "2030-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "A test hackathon submission." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit Hackathon" }));

    expect(screen.getByText("Thanks for the submission")).toBeInTheDocument();
  });
});
