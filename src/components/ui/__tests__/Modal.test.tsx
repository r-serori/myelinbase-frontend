import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Modal, ModalFooter } from "../Modal";

// Tooltipをモック化
vi.mock("./ToolTip", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-mock">{children}</div>
  ),
}));

describe("Modal", () => {
  const onClose = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={onClose}>
        Content
      </Modal>
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders content when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <div>Modal Content</div>
        <ModalFooter>
          <button>Action</button>
        </ModalFooter>
      </Modal>
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>
    );

    // 閉じるボタン（Xアイコンを含むボタン）を探す
    // 実装では variant="close" size="close" のButtonコンポーネント
    const closeButtons = screen.getAllByRole("button");
    // 閉じるボタンは通常ヘッダーにある最初のボタンか、アイコンで判別可能だが、
    // ここでは単純にボタンをクリックして確認
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>
    );

    // createPortalを使っているので、直接コンテナから探すのではなく、
    // DOM構造に依存する形になるが、backdropは固定位置のdiv
    // テストライブラリの推奨ではないが、backdropをクリックする必要がある

    // backdropは "absolute inset-0 bg-black/40" クラスを持つ要素
    // screen.getByText('Content') の親の親の兄弟要素など...

    // testing-library的なアプローチ:
    // backdropにはroleがないため、class等で特定するか、aria-hidden等をつけるのがベターだが、
    // ここでは実装コードの構造上、一番外側のdivの直下にあるdiv(backdrop)をクリックする

    // Portalのルート要素を取得
    const portalRoot = document.body.lastElementChild;
    if (!portalRoot) throw new Error("Portal root not found");

    const backdrop = portalRoot.querySelector(".bg-black\\/40");
    if (!backdrop) throw new Error("Backdrop not found");

    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll when open", () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("unlocks body scroll when closed", () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal isOpen={false} onClose={onClose}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe("");
  });
});
