import { defineConfig } from "drizzle-kit";
import dbCredentials from "./src/db/dbConfig";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/db/schema.ts"],
  out: "./drizzle",
  dbCredentials,
});
