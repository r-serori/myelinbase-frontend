import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export function useUpload() {
  return useMutation({
    mutationFn: async (payload: {
      file?: File;
      files?: File[];
      config?: Record<string, any>;
    }) => {
      const form = new FormData();
      const files = payload.files ?? (payload.file ? [payload.file] : []);
      files.forEach((f) => form.append("file", f));
      if (payload.config) {
        Object.entries(payload.config).forEach(([k, v]) => {
          form.append(k, String(v));
        });
      }
      return apiFetch("/documents/upload", {
        method: "POST",
        body: form as any,
      });
    },
  });
}
