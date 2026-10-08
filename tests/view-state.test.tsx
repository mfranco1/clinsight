import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRetainedState, ViewStateProvider } from "../src/app/ViewState";
import { useState } from "react";

function FilterState({ stateKey }: { stateKey: string }) {
  const [query, setQuery] = useRetainedState(stateKey, "");
  return (
    <label>
      Search
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
    </label>
  );
}

describe("session view state", () => {
  it("retains filter values across feature unmounts within the provider", () => {
    function ViewSwitcher() {
      const [show, setShow] = useState(true);
      return (
        <>
          <button onClick={() => setShow((current) => !current)}>
            {show ? "Hide view" : "Show view"}
          </button>
          {show && <FilterState stateKey="patient:test:orders:search" />}
        </>
      );
    }

    render(
      <ViewStateProvider>
        <ViewSwitcher />
      </ViewStateProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "CBC" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hide view" }));
    fireEvent.click(screen.getByRole("button", { name: "Show view" }));

    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("CBC");
  });

  it("resolves cached state when a mounted view changes its state key", () => {
    function KeySwitcher() {
      const [stateKey, setStateKey] = useState("patient:first:search");
      const [query, setQuery] = useRetainedState(stateKey, "");
      return (
        <>
          <button onClick={() => setStateKey("patient:second:search")}>
            Switch patient
          </button>
          <label>
            Search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </>
      );
    }

    render(
      <ViewStateProvider>
        <KeySwitcher />
      </ViewStateProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "first patient" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Switch patient" }));

    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");
    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "second patient" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Switch patient" }));
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue(
      "second patient",
    );
  });
});
