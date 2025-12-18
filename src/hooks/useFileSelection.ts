import { useState, useEffect } from "react";
import { ALLOWED_EXTENSIONS } from "@/lib/schemas/document";
import { Preview } from "@/components/documents/FilePreviewList";

export function useFileSelection() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.kind === "pdf" && p.url) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [previews]);

  async function buildPreviews(files: File[]) {
    const out: Preview[] = [];
    for (const f of files) {
      const mime = f.type || "application/octet-stream";
      const isAllowed = ALLOWED_EXTENSIONS.some((ext) =>
        f.name.toLowerCase().endsWith(ext)
      );

      if (
        mime.startsWith("text/") ||
        (isAllowed &&
          (f.name.toLowerCase().endsWith(".md") ||
            f.name.toLowerCase().endsWith(".markdown")))
      ) {
        try {
          const text = await f.text();
          out.push({
            kind: "text",
            name: f.name,
            size: f.size,
            mime,
            snippet: text.slice(0, 2000),
          });
        } catch {
          out.push({
            kind: "text",
            name: f.name,
            size: f.size,
            mime,
            snippet: "",
          });
        }
      } else if (mime === "application/pdf") {
        const url = URL.createObjectURL(f);
        out.push({ kind: "pdf", name: f.name, size: f.size, mime, url });
      }
    }
    setPreviews(out);
  }

  function getUniqueFileName(file: File, existingNames: Set<string>): File {
    let name = file.name;
    if (!existingNames.has(name)) return file;

    const dotIndex = name.lastIndexOf(".");
    const ext = dotIndex !== -1 ? name.substring(dotIndex) : "";
    const base = dotIndex !== -1 ? name.substring(0, dotIndex) : name;

    let counter = 1;
    let newName = `${base} (${counter})${ext}`;

    while (existingNames.has(newName)) {
      counter++;
      newName = `${base} (${counter})${ext}`;
    }

    return new File([file], newName, {
      type: file.type,
      lastModified: file.lastModified,
    });
  }

  function isAllowedFile(file: File): boolean {
    const name = file.name.toLowerCase();
    if (name.startsWith(".")) return false;
    if (file.size === 0) return false;
    return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  }

  function addFiles(files: File[]) {
    if (!files.length) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach((f) => {
      if (isAllowedFile(f)) {
        validFiles.push(f);
      } else {
        if (f.name !== "." && !f.name.startsWith(".")) {
          invalidFiles.push(f.name);
        }
      }
    });

    if (invalidFiles.length > 0) {
      console.log("invalidFiles", JSON.stringify(invalidFiles));
      const displayInvalid = invalidFiles.slice(0, 5);
      const remaining = invalidFiles.length - 5;
      const errorMsg = `一部のファイルはスキップされました（未対応形式など）: ${displayInvalid.join(
        ", "
      )}${remaining > 0 ? ` 他 ${remaining} 件` : ""}`;
      setErrorMessage(errorMsg);
    } else {
      setErrorMessage(null);
    }

    if (validFiles.length === 0) return;

    const existingNames = new Set(selectedFiles.map((f) => f.name));

    const newFiles = validFiles.map((f) => {
      const uniqueFile = getUniqueFileName(f, existingNames);
      existingNames.add(uniqueFile.name);
      return uniqueFile;
    });

    const next = [...selectedFiles, ...newFiles];
    setSelectedFiles(next);
    buildPreviews(next);
  }

  function removeFile(name: string) {
    const next = selectedFiles.filter((f) => f.name !== name);
    setSelectedFiles(next);
    buildPreviews(next);
  }

  function clearFiles() {
    setSelectedFiles([]);
    setPreviews([]);
    setErrorMessage(null);
  }

  return {
    selectedFiles,
    previews,
    errorMessage,
    setErrorMessage,
    addFiles,
    removeFile,
    clearFiles
  };
}

