import { z } from "zod";

export const NotebookSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Notebook = z.infer<typeof NotebookSchema>;
