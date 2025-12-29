import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Tooltip from "../Tooltip";

describe("Tooltip", () => {
  it("renders trigger icon", () => {
    const { container } = render(<Tooltip position="top-0">Help</Tooltip>);
    expect(container.querySelector("button")).toBeInTheDocument();
    // Lucide icon check
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows content on click", () => {
    render(<Tooltip position="top-0">Help Content</Tooltip>);

    expect(screen.queryByText("Help Content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Help Content")).toBeInTheDocument();
  });

  it("hides content on second click", () => {
    render(<Tooltip position="top-0">Help Content</Tooltip>);

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByText("Help Content")).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText("Help Content")).not.toBeInTheDocument();
  });

  it("applies position class", () => {
    render(<Tooltip position="top-10 left-10">Help Content</Tooltip>);

    fireEvent.click(screen.getByRole("button"));
    const tooltipContainer = screen.getByText("Help Content");

    expect(tooltipContainer).toHaveClass("top-10");
    expect(tooltipContainer).toHaveClass("left-10");
  });
});
