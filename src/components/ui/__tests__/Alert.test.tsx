import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Alert from "../Alert";

describe("Alert", () => {
  it("renders children correctly", () => {
    render(<Alert>Something happened</Alert>);
    expect(screen.getByText("Something happened")).toBeInTheDocument();
  });

  it("renders default icon (Info) for default color", () => {
    const { container } = render(<Alert>Info Alert</Alert>);
    // lucide-reactのアイコンはSVGとしてレンダリングされる
    // クラス名やdata-testid等がない場合、詳細な特定は難しいが、ここではレンダリング落ちてないか確認
    expect(container.querySelector("svg")).toBeInTheDocument();
    // Infoアイコンは text-primary クラスを持つ（defaultカラーの場合）
    expect(container.querySelector("svg")).toHaveClass("text-primary");
  });

  it("renders correct icon for destructive color", () => {
    const { container } = render(<Alert color="destructive">Error</Alert>);
    expect(container.querySelector("svg")).toHaveClass("text-destructive");
    expect(container.firstChild).toHaveClass("bg-destructive/5");
  });

  it("renders correct icon for success color", () => {
    const { container } = render(<Alert color="success">Success</Alert>);
    expect(container.querySelector("svg")).toHaveClass("text-success");
  });

  it("applies custom className", () => {
    const { container } = render(<Alert className="mt-4">Margin Alert</Alert>);
    expect(container.firstChild).toHaveClass("mt-4");
  });
});
