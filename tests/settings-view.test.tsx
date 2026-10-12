import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsView from "../src/features/settings/SettingsView";

describe("SettingsView", () => {
  it("shows safe inline recovery feedback when a preference update throws", async () => {
    const setDefaultSpecialization = vi.fn(() => {
      throw new Error("storage path details");
    });
    render(
      <SettingsView
        defaultSpecialization="General Practice"
        setDefaultSpecialization={setDefaultSpecialization}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(
        "Could not update the default specialization. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("storage path details")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
