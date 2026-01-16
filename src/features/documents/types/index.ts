import { z } from "zod";

import { DocumentStatus } from "@/lib/api/generated/model";

export const DocumentStatusSchema = z.enum(DocumentStatus);

export const DocumentStatusFilterSchema = z.union([
  DocumentStatusSchema,
  z.literal("ALL"),
]);

export type DocumentStatusFilter = z.infer<typeof DocumentStatusFilterSchema>;
