import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { ViewStateProvider } from "../src/app/ViewState";
import { structuredPatientCase } from "./fixtures/patient-cases";

const originalStorageDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);

const aiActions = vi.hoisted(() => ({
  generateChart: vi.fn(),
  generateProgressNote: vi.fn(),
  reassessNote: vi.fn(),
  refreshSummary: vi.fn(),
}));

vi.mock("../src/services/ai/geminiGateway", () => ({
  geminiGateway: aiActions,
}));

vi.mock("../src/features/dashboard/DashboardView", async () => {
  const React = await import("react");
  return {
    default: ({
      patients,
      onSelectPatient,
    }: {
      patients: { id: string; patientInfo: { patientName: string } }[];
      onSelectPatient: (id: string) => void;
    }) =>
      React.createElement(
        "div",
        null,
        patients.map((patient) =>
          React.createElement(
            "button",
            { key: patient.id, onClick: () => onSelectPatient(patient.id) },
            patient.patientInfo.patientName,
          ),
        ),
      ),
  };
});

vi.mock("../src/features/chart/SoapView", async () => {
  const React = await import("react");
  return {
    default: ({ onReassess }: { onReassess: () => void }) =>
      React.createElement("button", { onClick: onReassess }, "Reassess"),
  };
});

describe("App async patient actions", () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = new Map();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => storage.clear(),
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) =>
          storage.set(key, String(value)),
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalStorageDescriptor) {
      Object.defineProperty(window, "localStorage", originalStorageDescriptor);
    } else {
      Reflect.deleteProperty(window, "localStorage");
    }
  });

  it("ignores a reassessment that finishes after the user switches patients", async () => {
    const secondPatient = {
      ...structuredPatientCase,
      id: "patient-second",
      patientInfo: {
        ...structuredPatientCase.patientInfo,
        patientName: "Second Patient",
        mrn: "TEST-002",
      },
      entries: [
        {
          ...structuredPatientCase.entries[0],
          id: "entry-second",
        },
      ],
      handoff: {
        ...structuredPatientCase.handoff,
        patientId: "patient-second",
      },
    };
    window.localStorage.setItem(
      "clinsight_patients",
      JSON.stringify([structuredPatientCase, secondPatient]),
    );

    let resolveReassessment: ((result: unknown) => void) | undefined;
    aiActions.reassessNote.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReassessment = resolve;
        }),
    );

    render(
      <ViewStateProvider>
        <App />
      </ViewStateProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Test Patient" }));
    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: /Reassess/ },
        { timeout: 10000 },
      ),
    );
    await waitFor(() => expect(aiActions.reassessNote).toHaveBeenCalledOnce());

    fireEvent.click(screen.getAllByRole("button", { name: "Dashboard" })[0]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Second Patient" }),
    );
    expect(await screen.findByText("Second Patient")).toBeInTheDocument();

    resolveReassessment?.({
      assessment: { summary: "Stale reassessment", rationale: [] },
      plan: [],
      references: [],
      groundingSources: [],
    });

    await waitFor(() => {
      const persisted = JSON.parse(
        window.localStorage.getItem("clinsight_patients") || "[]",
      );
      expect(persisted[0].entries[0].soap.assessment.summary).toBe(
        "Stable test patient",
      );
      expect(persisted[1].entries[0].soap.assessment.summary).toBe(
        "Stable test patient",
      );
    });
  });
});
