import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Spinner from "../Spinner";

describe("Spinner", () => {
  it("renders correctly with default props", () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild;
    expect(spinner).toHaveClass("animate-spin");
    expect(spinner).toHaveClass("size-5");
    expect(spinner).toHaveClass("border-background");
  });

  it("applies custom size and color", () => {
    const { container } = render(<Spinner size="10" color="primary" />);
    const spinner = container.firstChild;
    expect(spinner).toHaveClass("size-10");
    expect(spinner).toHaveClass("border-primary");
  });

  it("applies additional className", () => {
    const { container } = render(<Spinner className="mt-4" />);
    expect(container.firstChild).toHaveClass("mt-4");
  });
});
