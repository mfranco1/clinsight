import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ClinicalMarkdown from "../src/components/clinical/ClinicalMarkdown";

describe("ClinicalMarkdown", () => {
  it("preserves custom paragraph, heading, and list rendering", () => {
    const { container } = render(
      <ClinicalMarkdown
        content={"## Assessment\n\nClinical summary\n\n- First finding"}
        className="custom-prose"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Assessment" }),
    ).toHaveClass("text-sm", "font-bold");
    expect(screen.getByText("Clinical summary").tagName).toBe("P");
    expect(container.querySelector("ul")).toHaveClass("list-disc", "pl-5");
    expect(container.firstElementChild).toHaveClass("custom-prose");
    expect(container.firstElementChild?.firstElementChild).toHaveClass(
      "prose",
      "prose-sm",
      "max-w-none",
    );
  });

  it("renders GFM tables, task lists, nested formatting, and math", () => {
    const { container } = render(
      <ClinicalMarkdown
        content={[
          "| Test | Result |",
          "| --- | ---: |",
          "| **Sodium** | 140 mmol/L |",
          "",
          "- [x] Reviewed",
          "  - Nested *finding*",
          "",
          String.raw`Dose: \(\frac{1}{2}x^2\) and $a+b$.`,
          "",
          String.raw`$$\frac{1}{2}$$`,
          "",
          String.raw`\[x_2 + 1\]`,
        ].join("\n")}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("140 mmol/L")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Completed task" }),
    ).toBeDisabled();
    expect(screen.getByText("finding").tagName).toBe("EM");
    expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(
      3,
    );
    expect(container.querySelector("math")).not.toBeNull();
  });

  it("renders sanitized HTML fragments while preserving safe semantic markup", () => {
    const { container } = render(
      <ClinicalMarkdown
        format="html"
        content={
          '<p><u>Underline</u> <sub>2</sub><br><a href="https://example.com">source</a><script>bad()</script><img src="https://tracker.invalid/pixel" alt="diagram"></p>'
        }
      />,
    );

    expect(screen.getByText("Underline").tagName).toBe("U");
    expect(container.querySelector("sub")).toHaveTextContent("2");
    expect(screen.getByRole("link", { name: "source" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("diagram")).toBeInTheDocument();
  });

  it("renders math inside an HTML fragment in Markdown mode", () => {
    const { container } = render(
      <ClinicalMarkdown
        content={"<p>Equation: \\(x_2 + 1\\)</p><p><strong>Result</strong></p>"}
      />,
    );

    expect(container.querySelectorAll(".katex").length).toBeGreaterThan(0);
    expect(screen.getByText("Result").tagName).toBe("STRONG");
  });

  it("keeps invalid math commands visible", () => {
    const { container } = render(
      <ClinicalMarkdown content={String.raw`$\unsupportedCommand$`} />,
    );

    expect(container.textContent).toContain("unsupportedCommand");
  });

  it("blocks unsafe links and keeps code and HTML attributes out of math normalization", () => {
    const { container } = render(
      <ClinicalMarkdown
        content={
          '[bad](javascript:alert(1)) `\\(x_2\\)`\n\n<div title="\\(not_math\\)">safe text</div>'
        }
      />,
    );

    expect(
      container.querySelector("a[href^='javascript']"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("bad").tagName).not.toBe("A");
    expect(container.querySelector("code")).toHaveTextContent(
      String.raw`\(x_2\)`,
    );
    expect(container.querySelector(".katex")).not.toBeInTheDocument();
    expect(container.querySelector("div[title]")).toHaveAttribute(
      "title",
      String.raw`\(not_math\)`,
    );
    expect(screen.getByText("safe text")).toBeInTheDocument();
  });

  it("keeps source text unchanged and exposes it for inspection", () => {
    const content = String.raw`Raw: $x_2$\n\[\frac{1}{2}\]`;
    render(<ClinicalMarkdown content={content} showSource />);

    expect(screen.getByText(content, { selector: "pre" })).toHaveTextContent(
      content,
    );
  });

  it("does not repeat source text in ordinary display by default", () => {
    render(<ClinicalMarkdown content="A displayed clinical note." />);

    expect(screen.getByText("A displayed clinical note.")).toBeInTheDocument();
    expect(screen.queryByText("View source")).not.toBeInTheDocument();
  });

  it("decorates nested search matches and valid citations without changing source text", () => {
    const source = "**Finding** [1] and [7], with `Finding` in code.";
    const { container } = render(
      <ClinicalMarkdown
        content={source}
        searchQuery="finding"
        groundingSources={[
          { title: "Guideline", uri: "https://example.com/guideline" },
        ]}
      />,
    );

    const searchMarks = container.querySelectorAll("mark");
    expect(searchMarks).toHaveLength(1);
    expect(searchMarks[0].closest("strong")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute(
      "href",
      "https://example.com/guideline",
    );
    expect(container.textContent).toContain("[7]");
    expect(container.querySelector("code mark")).not.toBeInTheDocument();
    expect(container.querySelector("[node]")).toBeNull();
    expect(source).toBe("**Finding** [1] and [7], with `Finding` in code.");
  });
});
