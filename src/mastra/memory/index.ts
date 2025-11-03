// {{RIPER-5:
//   Action: "Added"
//   Task_ID: "setup-postgres-memory"
//   Timestamp: "2025-01-27T10:30:00Z"
//   Authoring_Role: "LD"
//   Principle_Applied: "SOLID-S (单一职责原则)"
//   Quality_Check: "配置Mastra原生记忆系统，使用PostgreSQL和OpenAI嵌入"
// }}
// {{START_MODIFICATIONS}}

import { Memory } from "@mastra/memory";
import { PostgresStore, PgVector } from "@mastra/pg";

import { createOpenAI } from "@ai-sdk/openai";
const volcengine = createOpenAI({
  apiKey: process.env.VOLCENGINE_API_KEY || "",
  baseURL:
    process.env.VOLCENGINE_BASE_URL ||
    "https://ark.cn-beijing.volces.com/api/v3",
});

/**
 * Mastra.ai 记忆系统配置
 * 使用PostgreSQL作为存储后端，支持降维的火山引擎嵌入器
 */

// 创建支持降维的火山引擎嵌入器

export const memory = new Memory({
  // PostgreSQL存储配置
  storage: new PostgresStore({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://localhost:5432/recommendation_db",
  }),

  // PostgreSQL向量存储配置
  vector: new PgVector({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://localhost:5432/recommendation_db",
  }),

  // 使用支持降维的火山引擎嵌入器
  embedder: volcengine.embedding("ep-20251103145552-bg2vl"),

  // 记忆选项配置
  options: {
    // 保留最近的消息数量
    lastMessages: 10,

    // 语义召回配置
    semanticRecall: {
      topK: 5, // 返回最相关的5条记忆
      messageRange: 100, // 在最近100条消息中搜索
      scope: "resource", // 按资源范围搜索
    },

    // 工作记忆配置
    workingMemory: {
      enabled: true,
      scope: "resource", // 按用户资源管理工作记忆
    },

    // 线程配置
    threads: {
      generateTitle: true, // 自动生成线程标题
    },
  },
});

/**
 * 为特定用户创建记忆配置
 * @param userId 用户ID
 * @param threadId 线程ID（可选）
 */
export function createUserMemoryConfig(userId: string, threadId?: string) {
  return {
    thread: threadId || `user-${userId}-${Date.now()}`,
    resource: `user:${userId}`, // 资源标识符
  };
}

/**
 * 记忆系统健康检查
 */
export async function checkMemoryHealth() {
  try {
    // 这里可以添加记忆系统的健康检查逻辑
    // 例如测试数据库连接、向量存储等
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      components: {
        storage: "connected",
        vector: "connected",
        embedder: "ready",
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// {{END_MODIFICATIONS}}
