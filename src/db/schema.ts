import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "assistant"]);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  role: roleEnum("role").notNull().default("user"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
