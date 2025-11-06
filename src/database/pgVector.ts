import { PgVector } from "@mastra/pg";

export const pgVector = new PgVector({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/recommendation_db",
  schemaName: "rag_vectors", // 建议独立 schema 隔离管理
  idleTimeoutMillis: 60000, // 空闲连接超时
  pgPoolOptions: {
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true,
  },
});
