CREATE TYPE "public"."role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
