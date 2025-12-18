import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MarkdownViewer from "../MarkdownViewer";

describe("MarkdownViewer", () => {
  it("renders markdown content", () => {
    const content =
      "# Heading\n\n- List Item 1\n- List Item 2\n\n**Bold Text**";
    render(<MarkdownViewer content={content} />);

    // h1タグのクラスを確認することで正しくパースされているか確認
    const heading = screen.getByText("Heading");
    expect(heading.tagName).toBe("H1");
    expect(heading).toHaveClass("text-xl"); // h1 style check

    expect(screen.getByText("List Item 1")).toBeInTheDocument();
    expect(screen.getByText("Bold Text").tagName).toBe("STRONG");
  });

  it("renders code blocks", () => {
    const content = "```javascript\nconst a = 1;\n```";
    const { container } = render(<MarkdownViewer content={content} />);

    expect(screen.getByText("javascript")).toBeInTheDocument(); // Language label
    // SyntaxHighlighterがレンダリングされているか
    // テキスト内容が含まれているか
    expect(container.textContent).toContain("const a = 1;");
  });

  it("renders tables", () => {
    const content = "| Head 1 | Head 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |";
    render(<MarkdownViewer content={content} />);

    expect(screen.getByText("Head 1").tagName).toBe("TH");
    expect(screen.getByText("Cell 1").tagName).toBe("TD");
  });
});
