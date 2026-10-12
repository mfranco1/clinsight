import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PrivacyPolicyModal from "../src/components/PrivacyPolicyModal";
import TermsOfServiceModal from "../src/components/TermsOfServiceModal";

describe("legal policy modal compositions", () => {
  it("keeps Terms content and explicit acknowledgment dismissal", () => {
    const onClose = vi.fn();
    render(<TermsOfServiceModal isOpen onClose={onClose} />);

    expect(
      screen.getByRole("dialog", { name: "Terms of Service" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/IMPORTANT NOTICE:/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "I Agree" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps Privacy Policy content and explicit acknowledgment dismissal", () => {
    const onClose = vi.fn();
    render(<PrivacyPolicyModal isOpen onClose={onClose} />);

    expect(
      screen.getByRole("dialog", { name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Acknowledge & Close" }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
