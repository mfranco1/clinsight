import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ManageSectionsDropdown, {
  type SectionVisibility,
} from "../src/features/chart/components/ManageSectionsDropdown";

const createVisibility = (value: boolean): SectionVisibility => ({
  subjective: {
    chiefComplaint: value,
    hpi: value,
    ros: value,
    pmh: value,
    meds: value,
    family: value,
    social: value,
    anamnesis: value,
    birthMaternal: value,
    immunizations: value,
    nutrition: value,
    developmental: value,
    headsss: value,
    sexualHistory: value,
  },
  objective: {
    vitals: value,
    anthropometrics: value,
    physicalExam: value,
    labs: value,
    imaging: value,
  },
});

describe("ManageSectionsDropdown", () => {
  it("exposes keyboard-operable accordion controls and labelled category actions", () => {
    const onChange = vi.fn();

    render(
      <ManageSectionsDropdown
        visibility={createVisibility(false)}
        onChange={onChange}
        onClose={vi.fn()}
      />,
    );

    const subjectiveToggle = screen.getByRole("button", {
      name: "Subjective",
    });
    expect(subjectiveToggle).toHaveAttribute("aria-expanded", "false");
    expect(subjectiveToggle).toHaveAttribute(
      "aria-controls",
      "manage-sections-subjective",
    );

    fireEvent.click(subjectiveToggle);
    expect(subjectiveToggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("checkbox", { name: "Chief Complaint" }),
    ).not.toBeChecked();

    fireEvent.click(
      screen.getByRole("button", { name: "Show all subjective sections" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...createVisibility(false),
      subjective: Object.fromEntries(
        Object.keys(createVisibility(false).subjective).map((key) => [
          key,
          true,
        ]),
      ),
    });
  });
});
