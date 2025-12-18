import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DocumentSearchBar from "../DocumentSearchBar";
import { vi } from "vitest";
import { FilterState, AppliedFilters } from "@/hooks/useDocumentFilters";

describe("DocumentSearchBar", () => {
  const defaultFilters: FilterState = {
    filenameInput: "",
    tagsInput: "",
    statusFilter: "ALL",
    tagMode: "OR",
    isUntaggedInput: false,
  };

  const defaultApplied: AppliedFilters = {
    filename: undefined,
    tags: [],
    isUntagged: false,
  };

  const mockActions = {
    setFilenameInput: vi.fn(),
    setTagsInput: vi.fn(),
    setIsUntaggedInput: vi.fn(),
    setStatusFilter: vi.fn(),
    setTagMode: vi.fn(),
    setShowTagSuggestions: vi.fn(),
    applyFilters: vi.fn(),
    selectTagSuggestion: vi.fn(),
    clearFilename: vi.fn(),
    clearTags: vi.fn(),
    clearUntagged: vi.fn(),
    clearStatus: vi.fn(),
    clearAll: vi.fn(),
  };

  const defaultProps = {
    filters: defaultFilters,
    applied: defaultApplied,
    actions: mockActions,
    hasConditions: false,
    tagSuggestions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input fields correctly", () => {
    render(<DocumentSearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText("例: 規定, rules")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例: 会社規定, 労働基準")).toBeInTheDocument();
    expect(screen.getByText("ステータス")).toBeInTheDocument();
  });

  it("calls setFilenameInput on filename change", () => {
    render(<DocumentSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText("例: 規定, rules");
    fireEvent.change(input, { target: { value: "test" } });
    expect(mockActions.setFilenameInput).toHaveBeenCalledWith("test");
  });

  it("calls setTagsInput on tags change", () => {
    render(<DocumentSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText("例: 会社規定, 労働基準");
    fireEvent.change(input, { target: { value: "tag" } });
    expect(mockActions.setTagsInput).toHaveBeenCalledWith("tag");
  });

  it("opens status dropdown and calls setStatusFilter", async () => {
    render(<DocumentSearchBar {...defaultProps} />);
    // statusDropdown is div with text "すべて" (default)
    const dropdownTrigger = screen.getByText("すべて");
    fireEvent.click(dropdownTrigger);

    const completedOption = screen.getByText("完了");
    fireEvent.mouseDown(completedOption); // DropdownItem uses onMouseDown

    expect(mockActions.setStatusFilter).toHaveBeenCalledWith("COMPLETED");
  });

  it("calls applyFilters when search button is clicked", () => {
    render(<DocumentSearchBar {...defaultProps} />);
    const searchButton = screen.getByTitle("検索を実行");
    fireEvent.click(searchButton);
    expect(mockActions.applyFilters).toHaveBeenCalled();
  });

  it("displays active conditions and calls clear actions", () => {
    const appliedProps = {
      ...defaultProps,
      hasConditions: true,
      applied: {
        filename: "testfile",
        tags: ["tag1"],
        isUntagged: false,
      },
      filters: {
        ...defaultFilters,
        statusFilter: "COMPLETED" as const,
      }
    };
    render(<DocumentSearchBar {...appliedProps} />);

    expect(screen.getByText(/ファイル名: testfile/)).toBeInTheDocument();
    expect(screen.getByText(/タグ: tag1/)).toBeInTheDocument();
    expect(screen.getByText(/ステータス: 完了/)).toBeInTheDocument();

    // Clear filename
    // Find close button for filename chip. The component uses Button with X icon.
    // We can find by parent context or test generally that buttons exist.
    // The component structure: <div>Text... <Button><X/></Button></div>
    
    // Simulating clear filename
    const clearFilenameBtn = screen.getAllByRole("button").find(btn => 
      btn.parentElement?.textContent?.includes("ファイル名: testfile")
    );
    if (clearFilenameBtn) fireEvent.click(clearFilenameBtn);
    expect(mockActions.clearFilename).toHaveBeenCalled();

    // Simulating clear status (since status != ALL)
    const clearStatusBtn = screen.getAllByRole("button").find(btn => 
      btn.parentElement?.textContent?.includes("ステータス: 完了")
    );
    if (clearStatusBtn) fireEvent.click(clearStatusBtn);
    expect(mockActions.clearStatus).toHaveBeenCalled();
  });

  it("shows tag suggestions", () => {
    const propsWithSuggestions = {
      ...defaultProps,
      tagSuggestions: ["suggest1", "suggest2"],
    };
    render(<DocumentSearchBar {...propsWithSuggestions} />);
    
    const input = screen.getByPlaceholderText("例: 会社規定, 労働基準");
    fireEvent.focus(input);
    
    expect(mockActions.setShowTagSuggestions).toHaveBeenCalledWith(true);
    
    // Since DropdownList renders children, we check if suggestions are rendered.
    // Note: The component logic: {tagSuggestions.length > 0 && ... <DropdownList>}
    // But it might depend on parent state passing down suggestions. 
    // Here we pass suggestions via props, so they should render if the condition is met.
    expect(screen.getByText("suggest1")).toBeInTheDocument();
  });
});

