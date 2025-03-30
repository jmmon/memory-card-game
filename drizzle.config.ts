// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: ["./src/v3/db/scores.schema.ts", "./src/v3/db/scoreCounts.schema.ts"],
  out: "./src/v3/db/migrations",
});
