import { describe, expect, it } from "vitest";

import { cn, parseTags } from "../utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("merges tailwind classes using tailwind-merge", () => {
      // p-4 should override p-2
      expect(cn("p-2", "p-4")).toBe("p-4");
      // text-red-500 should override text-blue-500
      expect(cn("text-blue-500", "text-red-500")).toBe("text-red-500");
    });
  });

  describe("parseTags", () => {
    it("parses comma separated string into array", () => {
      expect(parseTags("tag1, tag2, tag3")).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("removes whitespace", () => {
      expect(parseTags("  tag1  ,  tag2  ")).toEqual(["tag1", "tag2"]);
    });

    it("removes duplicates", () => {
      expect(parseTags("tag1, tag1, tag2")).toEqual(["tag1", "tag2"]);
    });

    it("ignores empty parts", () => {
      expect(parseTags("tag1,,tag2, ")).toEqual(["tag1", "tag2"]);
    });

    it("returns empty array for empty string", () => {
      expect(parseTags("")).toEqual([]);
      expect(parseTags("   ")).toEqual([]);
    });
  });
});
