import { render, screen, fireEvent } from "@testing-library/react";
import TagList from "../TagList";
import { vi } from "vitest";

describe("TagList", () => {
  const defaultProps = {
    tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
    onTagClick: vi.fn(),
  };

  it("renders 'タグ未設定' when tags are empty", () => {
    render(<TagList tags={[]} />);
    expect(screen.getByText("タグ未設定")).toBeInTheDocument();
  });

  it("renders visible tags (up to 3)", () => {
    render(<TagList {...defaultProps} />);
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
    expect(screen.getByText("tag3")).toBeInTheDocument();
    expect(screen.queryByText("tag4")).not.toBeInTheDocument();
  });

  it("renders overflow button", () => {
    render(<TagList {...defaultProps} />);
    const moreButton = screen.getByRole("button", { name: "+2" });
    expect(moreButton).toBeInTheDocument();
  });

  it("opens popover when overflow button is clicked", () => {
    render(<TagList {...defaultProps} />);
    const moreButton = screen.getByRole("button", { name: "+2" });
    fireEvent.click(moreButton);

    // Popover content should be visible
    expect(screen.getByText("タグ一覧 (5)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tag4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tag5" })).toBeInTheDocument();
  });

  it("calls onTagClick when a tag is clicked in main list", () => {
    render(<TagList {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "tag1" }));
    expect(defaultProps.onTagClick).toHaveBeenCalledWith("tag1");
  });

  it("calls onTagClick when a tag is clicked in popover", () => {
    render(<TagList {...defaultProps} />);
    const moreButton = screen.getByRole("button", { name: "+2" });
    fireEvent.click(moreButton);
    
    const tag4 = screen.getByRole("button", { name: "tag4" });
    fireEvent.click(tag4);
    expect(defaultProps.onTagClick).toHaveBeenCalledWith("tag4");
  });
});

