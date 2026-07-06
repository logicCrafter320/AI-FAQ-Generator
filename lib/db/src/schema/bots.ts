import { pgTable, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botsTable = pgTable("bots", {
  id: text("id").primaryKey(),
  businessDescription: text("business_description").notNull(),
  faqs: jsonb("faqs").notNull().$type<{ question: string; answer: string }[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  viewCount: integer("view_count").notNull().default(0),
  chatCount: integer("chat_count").notNull().default(0),
});

export const insertBotSchema = createInsertSchema(botsTable).omit({ createdAt: true });
export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof botsTable.$inferSelect;
