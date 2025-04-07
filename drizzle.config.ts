// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: ["./src/v3/db/schemas/scores.schema.ts"],
  out: "./src/v3/db/migrations",
});
