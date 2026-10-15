import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "../src/App";
import { ViewStateProvider } from "../src/app/ViewState";
import { contractPatientCase } from "./fixtures/patient-cases";
import type { MedicalChartResponse } from "../src/types";

const fixture = vi.hoisted(() => ({
  data: [] as MedicalChartResponse | MedicalChartResponse[],
}));
vi.mock("../src/utils/ids", () => ({ createId: () => "generated-import-id" }));
vi.mock("../src/features/input/InputSection", async () => {
  const React = await import("react");
  return {
    default: ({
      onImport,
    }: {
      onImport: (data: MedicalChartResponse | MedicalChartResponse[]) => void;
    }) =>
      React.createElement(
        "button",
        { onClick: () => onImport(fixture.data) },
        "Import synthetic",
      ),
  };
});
vi.mock("../src/features/chart/SoapView", async () => {
  const React = await import("react");
  return { default: () => React.createElement("div", null, "Imported chart") };
});
const storageDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);
let storage: Map<string, string>;
beforeEach(() => {
  storage = new Map();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
});
afterEach(() => {
  if (storageDescriptor)
    Object.defineProperty(window, "localStorage", storageDescriptor);
});

it.each(["object", "singleton", "batch", "empty"] as const)(
  "characterizes the actual internal App import handler: %s",
  async (shape) => {
    const imported = { ...contractPatientCase, id: "" };
    fixture.data =
      shape === "object"
        ? imported
        : shape === "singleton"
          ? [imported]
          : shape === "batch"
            ? [imported, { ...contractPatientCase, id: "second" }]
            : [];
    render(
      <ViewStateProvider>
        <App />
      </ViewStateProvider>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Add Patient" })[0]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Import synthetic" }),
    );
    await waitFor(() => {
      const patients = JSON.parse(storage.get("clinsight_patients") || "null");
      expect(patients).toHaveLength(
        shape === "empty" ? 0 : shape === "batch" ? 2 : 1,
      );
      if (shape !== "empty") {
        expect(patients[0].id).toBe("generated-import-id");
        // Only the chart ID is assigned: legacy handoff content and missing links stay untouched.
        expect(patients[0].handoff.patientId).toBe(
          contractPatientCase.handoff.patientId,
        );
        expect(patients[0].entries[2].encounterId).toBeUndefined();
        expect(patients[0].entries[0].originalNote).toBe(
          contractPatientCase.entries[0].originalNote,
        );
      }
      if (shape === "batch") expect(patients[1].id).toBe("second");
    });
    if (shape === "object" || shape === "singleton")
      expect(await screen.findByText("Imported chart")).toBeInTheDocument();
    else if (shape === "batch")
      expect(
        await screen.findByText("Successfully uploaded 2 patient cases"),
      ).toBeInTheDocument();
    else
      expect(
        screen.getByRole("button", { name: "Import synthetic" }),
      ).toBeInTheDocument();
  },
);
