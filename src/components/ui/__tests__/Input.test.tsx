import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Input } from "../Input";

describe("Input", () => {
  it("renders correctly", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("handles user input", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("test");
  });

  it("applies size classes", () => {
    render(<Input size="sm" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("h-7");
  });

  it("can be disabled", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("supports other input types", () => {
    const { container } = render(<Input type="checkbox" />);
    expect(
      container.querySelector('input[type="checkbox"]')
    ).toBeInTheDocument();
  });
});
