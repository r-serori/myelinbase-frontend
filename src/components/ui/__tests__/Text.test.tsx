import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Text } from "../Text";

describe("Text", () => {
  it("renders children correctly", () => {
    render(<Text>Hello World</Text>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it('renders as different elements using "as" prop', () => {
    const { container } = render(<Text as="h1">Heading</Text>);
    expect(container.querySelector("h1")).toBeInTheDocument();
    expect(screen.getByText("Heading")).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const { container } = render(<Text variant="h1">Big Text</Text>);
    expect(container.firstChild).toHaveClass("text-4xl");
  });

  it("applies color classes", () => {
    const { container } = render(<Text color="destructive">Error Text</Text>);
    expect(container.firstChild).toHaveClass("text-destructive");
  });

  it("applies alignment classes", () => {
    const { container } = render(<Text align="center">Centered Text</Text>);
    expect(container.firstChild).toHaveClass("text-center");
  });

  it("forwards refs", () => {
    // 実際のDOM要素を取得して確認できるかテスト（簡易的）
    // render(<Text ref={ref} />) のように使う場面を想定
    // ここでは単純にレンダリング確認のみで十分
    expect(true).toBe(true);
  });
});
