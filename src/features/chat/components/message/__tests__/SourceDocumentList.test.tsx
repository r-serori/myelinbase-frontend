import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SourceDocumentList from "../SourceDocumentList";

describe("SourceDocumentList", () => {
  const documents = [
    { documentId: "1", fileName: "test1.pdf", text: "content 1", score: 0.9 },
    { documentId: "2", fileName: "test2.txt", text: "content 2", score: 0.8 },
  ];
  const onSourceClick = vi.fn();

  it("renders nothing if documents empty", () => {
    const { container } = render(<SourceDocumentList documents={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders document buttons", () => {
    render(
      <SourceDocumentList documents={documents} onSourceClick={onSourceClick} />
    );

    expect(screen.getByText("参照ソース")).toBeInTheDocument();
    expect(screen.getByText("test1.pdf")).toBeInTheDocument();
    expect(screen.getByText("test2.txt")).toBeInTheDocument();
  });

  it("calls onSourceClick", () => {
    render(
      <SourceDocumentList documents={documents} onSourceClick={onSourceClick} />
    );

    fireEvent.click(screen.getByText("test1.pdf"));
    expect(onSourceClick).toHaveBeenCalledWith(documents[0]);
  });
});
