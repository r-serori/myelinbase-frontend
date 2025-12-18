import { render, screen } from "@testing-library/react";
import Header from "../Header";
import { vi } from "vitest";

// モック
const mocks = vi.hoisted(() => {
  return {
    usePathname: vi.fn(),
    useAuth: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render on title page", () => {
    mocks.usePathname.mockReturnValue("/");
    mocks.useAuth.mockReturnValue({ isLoading: false, user: { userId: "1" } });
    const { container } = render(<Header />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render on login page", () => {
    mocks.usePathname.mockReturnValue("/login");
    mocks.useAuth.mockReturnValue({ isLoading: false, user: { userId: "1" } });
    const { container } = render(<Header />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when loading", () => {
    mocks.usePathname.mockReturnValue("/chat");
    mocks.useAuth.mockReturnValue({ isLoading: true, user: null });
    const { container } = render(<Header />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when user is not logged in", () => {
    mocks.usePathname.mockReturnValue("/chat");
    mocks.useAuth.mockReturnValue({ isLoading: false, user: null });
    const { container } = render(<Header />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly when user is logged in and not on auth pages", () => {
    mocks.usePathname.mockReturnValue("/chat");
    mocks.useAuth.mockReturnValue({ isLoading: false, user: { userId: "1" } });
    render(<Header />);

    expect(screen.getByText("Myelin Base")).toBeInTheDocument();
    expect(screen.getByText("チャット")).toBeInTheDocument();
    expect(screen.getByText("文書管理")).toBeInTheDocument();
  });

  it("highlights active link", () => {
    mocks.usePathname.mockReturnValue("/chat");
    mocks.useAuth.mockReturnValue({ isLoading: false, user: { userId: "1" } });
    render(<Header />);

    // Chat link should have active style (bg-primary/10)
    const chatLink = screen.getByText("チャット").closest("a");
    expect(chatLink).toHaveClass("bg-primary/10");

    const docsLink = screen.getByText("文書管理").closest("a");
    expect(docsLink).not.toHaveClass("bg-primary/10");
  });
});
