import { z } from "zod";

// ChatMessage schema with Zod
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  chat_session_id: z.string().uuid(),
  notebook_id: z.string().uuid(),
  user_id: z.string(),
  content: z.string(),
  is_user: z.boolean(),
  created_at: z.string().datetime(),
});

// Type derived from the schema
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ChatSession schema with Zod
export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  notebook_id: z.string().uuid(),
  user_id: z.string(),
  title: z.string(),
  created_at: z.string().datetime(),
});

// Type derived from the schema
export type ChatSession = z.infer<typeof ChatSessionSchema>;
