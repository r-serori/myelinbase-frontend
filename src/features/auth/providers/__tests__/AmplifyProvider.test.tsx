import { Amplify } from "@aws-amplify/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AmplifyProvider from "../AmplifyProvider";

// aws-amplifyのモック
vi.mock("@aws-amplify/core", () => ({
  Amplify: {
    configure: vi.fn(),
  },
}));

describe("AmplifyProvider", () => {
  it("configures Amplify and renders children", () => {
    render(
      <AmplifyProvider>
        <div>App Content</div>
      </AmplifyProvider>
    );

    // Configureが呼ばれたか確認
    expect(Amplify.configure).toHaveBeenCalled();

    // 子要素がレンダリングされたか確認
    expect(screen.getByText("App Content")).toBeInTheDocument();
  });
});
