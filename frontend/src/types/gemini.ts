import { z } from "zod";

// GenerationConfig schema with Zod
export const GenerationConfigSchema = z.object({
  temperature: z.number().min(0).max(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
});

// Type derived from the schema
export type GenerationConfig = z.infer<typeof GenerationConfigSchema>;

// Default generation config
export const defaultGenerationConfig: GenerationConfig = {
  temperature: 0.8,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
};

// Message role schema
export const MessageRoleSchema = z.enum(["user", "model"]);

// Type derived from the schema
export type MessageRole = z.infer<typeof MessageRoleSchema>;

// Message schema
export const MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
});

// Type derived from the schema
export type Message = z.infer<typeof MessageSchema>;
