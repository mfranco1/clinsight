import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LookupModal from "../src/features/input/components/LookupModal";

const { medicalLookup } = vi.hoisted(() => ({
  medicalLookup: vi.fn(),
}));

vi.mock("../src/services/ai/actions", () => ({ medicalLookup }));
vi.mock("../src/services/diagnosticLogger", () => ({
  logDiagnostic: vi.fn(),
}));

describe("LookupModal", () => {
  beforeEach(() => medicalLookup.mockReset());

  it("shows a shared recoverable error and retries the same query", async () => {
    medicalLookup
      .mockRejectedValueOnce(new Error("provider detail"))
      .mockResolvedValueOnce({ text: "Evidence summary", groundingSources: [] });
    render(<LookupModal isOpen onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "ACR Criteria for RA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Lookup failed");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "I'm sorry, I encountered an error during the lookup.",
    );
    expect(screen.queryByText("provider detail")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(medicalLookup).toHaveBeenLastCalledWith(
        "ACR Criteria for RA",
        expect.any(AbortSignal),
      ),
    );
    expect(await screen.findByText("Evidence summary")).toBeInTheDocument();
  });
});
