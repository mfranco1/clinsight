import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SuggestionsDrawer from "../src/features/input/components/SuggestionsDrawer";

const { generateInputSuggestions } = vi.hoisted(() => ({
  generateInputSuggestions: vi.fn(),
}));

vi.mock("../src/services/ai/actions", () => ({ generateInputSuggestions }));
vi.mock("../src/services/diagnosticLogger", () => ({
  logDiagnostic: vi.fn(),
}));

describe("SuggestionsDrawer", () => {
  beforeEach(() => generateInputSuggestions.mockReset());

  it("keeps prior suggestions and hides provider details after refresh failure", async () => {
    generateInputSuggestions
      .mockResolvedValueOnce({
        questions: [
          { text: "What symptoms should be clarified?", rationale: "Context" },
        ],
        tests: [],
      })
      .mockRejectedValueOnce(new Error("API_KEY_SECRET provider failure"));
    render(
      <SuggestionsDrawer
        isOpen
        onClose={vi.fn()}
        notesData="A sufficiently detailed synthetic clinical note for this test."
      />,
    );

    expect(
      await screen.findByText("What symptoms should be clarified?"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to load suggestions. Please try again.",
    );
    expect(
      screen.getByText("What symptoms should be clarified?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/API_KEY_SECRET|provider failure/),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(generateInputSuggestions).toHaveBeenCalledTimes(2),
    );
  });
});
