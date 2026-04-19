import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";

// 載入 .env.test.local (僅測試用，gitignored)
loadEnv({ path: path.resolve(process.cwd(), ".env.test.local") });

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    // 測試連本機 Postgres，彼此會互相污染，跑序列
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
