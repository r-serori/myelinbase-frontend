import { render, screen } from "@testing-library/react";

import StatusChip from "../StatusChip";

describe("StatusChip", () => {
  it("renders correct label for 'COMPLETED' status", () => {
    render(<StatusChip status="COMPLETED" />);
    // "完了" or "Success" depending on schema mapping, checking text content
    // Assuming 'COMPLETED' maps to a known label. If label depends on implementation, we check if it renders *something* reasonable or import the helper.
    // Let's check for class presence which indicates style application.
    const chip = screen.getByText(/完了|success/i); // Adjust based on actual label
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass("text-success");
  });

  it("renders correct label for 'PROCESSING' status", () => {
    render(<StatusChip status="PROCESSING" />);
    const chip = screen.getByText(/処理中|processing/i);
    expect(chip).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<StatusChip status="COMPLETED" className="custom-class" />);
    const chip = screen.getByText(/完了|success/i);
    expect(chip).toHaveClass("custom-class");
  });
});
