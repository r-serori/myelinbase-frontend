import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AuthLayout from "@/features/auth/components/AuthLayout";

describe("AuthLayout", () => {
  it("renders title and children", () => {
    render(
      <AuthLayout title="Test Title">
        <form>Child Form</form>
      </AuthLayout>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Child Form")).toBeInTheDocument();
    expect(screen.getByAltText("Myelin Base")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <AuthLayout title="Title" subtitle="Test Subtitle">
        <div>Child</div>
      </AuthLayout>
    );

    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });
});
