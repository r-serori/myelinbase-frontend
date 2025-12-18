import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Loading from "../Loading";

// ThreeTitleLogoはCanvas等を使う可能性があるためモック化
vi.mock("./ThreeTitleLogo", () => ({
  default: () => <div data-testid="three-logo-mock">Logo</div>,
}));

describe("Loading", () => {
  it("renders loading text and logo", () => {
    render(<Loading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByTestId("three-logo-mock")).toBeInTheDocument();
  });
});
