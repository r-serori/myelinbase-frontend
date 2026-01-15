import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

import { STATUS_FILTER_OPTIONS } from "@/features/documents/config/document-status";
import {
  DocumentStatusFilter,
  getDocumentDisplayLabel,
} from "@/features/documents/config/document-status";
import {
  AppliedFilters,
  FilterState,
} from "@/features/documents/hooks/useDocumentFilters";
import { Button } from "@/components/ui/Button";
import { DropdownItem, DropdownList } from "@/components/ui/DropDownList";
import Input from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import type { DocumentStatus } from "@/lib/api/generated/model";

type DocumentSearchBarProps = {
  filters: FilterState;
  applied: AppliedFilters;
  actions: {
    setFilenameInput: (v: string) => void;
    setTagsInput: (v: string) => void;
    setIsUntaggedInput: (v: boolean) => void;
    setStatusFilter: (v: "ALL" | DocumentStatus) => void;
    setTagMode: (v: "AND" | "OR") => void;
    setShowTagSuggestions: (v: boolean) => void;
    applyFilters: () => void;
    selectTagSuggestion: (tag: string) => void;
    clearFilename: () => void;
    clearTags: (tag?: string) => void;
    clearUntagged: () => void;
    clearStatus: () => void;
    clearAll: () => void;
  };
  hasConditions: boolean;
  tagSuggestions: string[];
};

export default function DocumentSearchBar({
  filters,
  applied,
  actions,
  hasConditions,
  tagSuggestions,
}: DocumentSearchBarProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  return (
    <div className="space-y-3 pb-2 w-full">
      <Text variant="sm" weight="semibold">
        アップロード済みファイルを検索
      </Text>

      <div className="flex flex-col gap-3">
        {/* 1行目: テキスト入力系 */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 ml-2">
          <div className="flex items-center gap-2">
            <Text
              variant="sm"
              color="muted"
              as="label"
              htmlFor="filenameInput"
              className="whitespace-nowrap"
            >
              ファイル名
            </Text>
            <Input
              id="filenameInput"
              size="sm"
              value={filters.filenameInput}
              onChange={(e) => actions.setFilenameInput(e.target.value)}
              placeholder="例: 規定, rules"
            />
          </div>

          <div className="flex items-center gap-2">
            <Text
              variant="sm"
              color="muted"
              as="span"
              className="whitespace-nowrap"
            >
              ステータス
            </Text>
            <div className="relative">
              <div
                id="statusDropdown"
                className="flex rounded-md border border-input text-sm shadow-xs transition-colors px-2 py-1 text-xs cursor-pointer hover:bg-muted/20 items-center justify-between w-[150px] bg-background h-7"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                onBlur={() => setShowStatusDropdown(false)}
                tabIndex={0}
              >
                <span className="truncate">
                  {getDocumentDisplayLabel(filters.statusFilter)}
                </span>
                <ChevronDown className="size-3 text-muted-foreground ml-1" />
              </div>

              {showStatusDropdown && (
                <DropdownList id="statusDropdownList" size="sm">
                  {STATUS_FILTER_OPTIONS.map(
                    (option: {
                      value: DocumentStatusFilter;
                      label: string;
                    }) => (
                      <DropdownItem
                        key={option.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          actions.setStatusFilter(
                            option.value as DocumentStatus
                          );
                          setShowStatusDropdown(false);
                        }}
                      >
                        {option.label}
                      </DropdownItem>
                    )
                  )}
                </DropdownList>
              )}
            </div>
          </div>
        </div>

        {/* 2行目: ステータス・条件・検索ボタン */}
        <div className="flex flex-col md:flex-row items-start md:items-center relative ml-2">
          <div className="flex-col items-center">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex items-center gap-2">
                <Text
                  variant="sm"
                  color="muted"
                  as="label"
                  htmlFor="tagsInput"
                  className="whitespace-nowrap"
                >
                  タグ
                </Text>
                <div className="relative">
                  <Input
                    id="tagsInput"
                    size="sm"
                    value={filters.tagsInput}
                    onFocus={() => actions.setShowTagSuggestions(true)}
                    onClick={() => actions.setShowTagSuggestions(true)}
                    onChange={(e) => {
                      actions.setShowTagSuggestions(true);
                      actions.setTagsInput(e.target.value);
                      if (filters.isUntaggedInput && e.target.value) {
                        actions.setIsUntaggedInput(false);
                      }
                    }}
                    onBlur={() => actions.setShowTagSuggestions(false)}
                    placeholder="例: 会社規定, 労働基準"
                    disabled={filters.isUntaggedInput}
                  />
                  {tagSuggestions.length > 0 && !filters.isUntaggedInput && (
                    <DropdownList id="tagSuggestions" size="sm">
                      {tagSuggestions.map((tag) => (
                        <DropdownItem
                          key={tag}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            actions.selectTagSuggestion(tag);
                          }}
                        >
                          {tag}
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Text
                  variant="xs"
                  color="muted"
                  as="label"
                  htmlFor="isUntaggedInput"
                  className="flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <Input
                    id="isUntaggedInput"
                    size="checkbox"
                    type="checkbox"
                    checked={filters.isUntaggedInput}
                    onChange={(e) =>
                      actions.setIsUntaggedInput(e.target.checked)
                    }
                  />
                  <Text variant="sm">未設定のみ</Text>
                </Text>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 mt-3 ${
                filters.isUntaggedInput ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              <Text variant="sm" color="muted" as="span">
                タグ条件
              </Text>
              <Text
                variant="sm"
                color="muted"
                as="label"
                htmlFor="tagModeAND"
                className="flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Input
                  id="tagModeAND"
                  size="radio"
                  type="radio"
                  name="tagMode"
                  value="AND"
                  checked={filters.tagMode === "AND"}
                  onChange={() => actions.setTagMode("AND")}
                  disabled={filters.isUntaggedInput}
                />
                <Text variant="sm" as="span">
                  AND
                </Text>
              </Text>
              <Text
                variant="sm"
                color="muted"
                as="label"
                htmlFor="tagModeOR"
                className="flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Input
                  id="tagModeOR"
                  size="radio"
                  type="radio"
                  name="tagMode"
                  value="OR"
                  checked={filters.tagMode === "OR"}
                  onChange={() => actions.setTagMode("OR")}
                  disabled={filters.isUntaggedInput}
                />
                <Text variant="sm" as="span">
                  OR
                </Text>
              </Text>
            </div>
          </div>

          <div className="md:ml-34 ml-auto mt-auto">
            <Button
              aria-label="検索を実行"
              variant="outline"
              size="sm"
              onClick={actions.applyFilters}
              title="検索を実行"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 条件表示チップ */}
      {hasConditions && (
        <div className="flex flex-wrap items-center gap-2 pt-2 w-full">
          <Text variant="sm" color="muted" weight="semibold" as="span">
            現在の条件:
          </Text>
          {applied.filename && (
            <div className="inline-flex items-center gap-1 rounded-full border px-2 bg-gray-50">
              <Text variant="sm" color="muted">
                ファイル名: {applied.filename}
              </Text>
              <Button
                aria-label="ファイル名をクリア"
                variant="iconSmall"
                size="iconSmall"
                onClick={actions.clearFilename}
              >
                <X className="size-3 cursor-pointer" />
              </Button>
            </div>
          )}
          {/* 未設定のみ条件の表示 */}
          {applied.isUntagged && (
            <div className="inline-flex items-center gap-1 rounded-full border px-2 bg-gray-50">
              <Text variant="sm" color="muted">
                タグ: 未設定
              </Text>
              <Button
                aria-label="未設定のみをクリア"
                variant="iconSmall"
                size="iconSmall"
                onClick={actions.clearUntagged}
              >
                <X className="size-3 cursor-pointer" />
              </Button>
            </div>
          )}
          {applied.tags.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border px-2 bg-gray-50"
            >
              <Text variant="sm" color="muted">
                タグ: {tag}
              </Text>
              <Button
                aria-label="タグをクリア"
                variant="iconSmall"
                size="iconSmall"
                onClick={() => actions.clearTags(tag)}
              >
                <X className="size-3 cursor-pointer" />
              </Button>
            </div>
          ))}
          {applied.tags.length > 1 && (
            <div className="inline-flex items-center gap-1 rounded-full border px-2 bg-gray-50">
              <Text variant="sm" color="muted">
                タグ条件:{" "}
                {filters.tagMode === "AND"
                  ? "すべて含む (AND)"
                  : "いずれか含む (OR)"}
              </Text>
              <span className="h-4"></span>
            </div>
          )}
          {filters.statusFilter !== "ALL" && (
            <div className="inline-flex items-center gap-1 rounded-full border px-2 bg-gray-50">
              <Text variant="sm" color="muted">
                ステータス: {getDocumentDisplayLabel(filters.statusFilter)}
              </Text>
              <Button
                aria-label="ステータスをクリア"
                variant="iconSmall"
                size="iconSmall"
                onClick={actions.clearStatus}
              >
                <X className="size-3 cursor-pointer" />
              </Button>
            </div>
          )}
          <Button
            aria-label="すべての条件をクリア"
            variant="link"
            size="sm"
            className="h-3 p-0 ml-2"
            onClick={actions.clearAll}
          >
            すべてクリア <X className="size-3 cursor-pointer" />
          </Button>
        </div>
      )}
    </div>
  );
}
