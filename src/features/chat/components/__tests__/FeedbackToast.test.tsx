import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FeedbackToast from "../FeedbackToast";

describe("FeedbackToast", () => {
  it("renders message", () => {
    render(<FeedbackToast message="Thanks for feedback" />);
    expect(screen.getByText("Thanks for feedback")).toBeInTheDocument();
  });
});
