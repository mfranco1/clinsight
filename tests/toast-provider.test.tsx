import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import ModalShell from "../src/components/ui/ModalShell";
import { ToastProvider, useToast } from "../src/components/ui/ToastProvider";

const Controls = () => {
  const { showToast, dismissToast } = useToast();
  return (
    <>
      <button onClick={() => showToast("Saved", { type: "success" })}>
        Add success
      </button>
      <button
        onClick={() => showToast("Failed", { id: "persistent", duration: 0 })}
      >
        Add persistent
      </button>
      <button onClick={() => dismissToast("persistent")}>Dismiss</button>
      {Array.from({ length: 5 }, (_, index) => (
        <button key={index} onClick={() => showToast(`Notice ${index + 1}`)}>
          Add {index + 1}
        </button>
      ))}
    </>
  );
};

const ToastAndModalControls = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() =>
          showToast("Background save failed", { duration: 0, id: "save-error" })
        }
      >
        Show persistent error
      </button>
      <button onClick={() => setIsModalOpen(true)}>Open dialog</button>
      <ModalShell
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit synthetic record"
      >
        <p>Dialog content</p>
      </ModalShell>
    </>
  );
};

describe("ToastProvider", () => {
  afterEach(() => vi.useRealTimers());

  it("stacks simultaneous messages and queues overflow without dropping it", () => {
    render(
      <ToastProvider>
        <Controls />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add success" }));
    fireEvent.click(screen.getByRole("button", { name: "Add persistent" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(screen.getByRole("alert")).toHaveTextContent("Failed");

    for (let index = 1; index <= 5; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: `Add ${index}` }));
    }

    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(screen.queryByText("Notice 5")).not.toBeInTheDocument();

    fireEvent.click(within(screen.getByRole("status")).getByRole("button"));
    expect(screen.getByText("Notice 3")).toBeInTheDocument();
  });

  it("keeps duration-zero messages until explicitly dismissed", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Controls />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add persistent" }));

    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByRole("alert")).toHaveTextContent("Failed");

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("preserves a persistent notification while a modal is open", () => {
    render(
      <ToastProvider>
        <ToastAndModalControls />
      </ToastProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Show persistent error" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(
      screen.getByRole("dialog", { name: "Edit synthetic record" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Background save failed",
    );
  });
});
