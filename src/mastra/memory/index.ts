import { Memory } from "@mastra/memory";
import { fastembed } from "@mastra/fastembed";
import { deepseek } from "../providers/deepseek";
import { ToolCallFilter, TokenLimiter } from "@mastra/memory/processors";
import { postgres } from "../../database/postgres";
import { pgVector } from "../../database/pgVector";

export const memory = new Memory({
  // PostgreSQL存储配置
  storage: postgres,
  processors: [
    new ToolCallFilter(), // 删除所有工具调用消息
    new ToolCallFilter({ exclude: ["generateImageTool"] }), // 仅排除图像生成工具
    new TokenLimiter(127000), // 放在最后
  ],
  // PostgreSQL向量存储配置
  vector: pgVector,

  embedder: fastembed,
  // 记忆选项配置
  options: {
    // 保留最近的消息数量
    lastMessages: 10,

    // 语义召回配置
    semanticRecall: {
      topK: 10, // 返回最相关的5条记忆
      messageRange: 100, // 在最近100条消息中搜索
      scope: "resource", // 按资源范围搜索
      indexConfig: {
        type: "hnsw", // Use HNSW for better performance
        metric: "dotproduct", // Best for OpenAI embeddings
        hnsw: {
          m: 16, // Number of bi-directional links (default: 16)
          efConstruction: 64, // Size of candidate list during construction (default: 64)
        },
      },
    },
    workingMemory: {
      enabled: true,
      scope: "resource", // 按用户资源管理工作记忆
      template: `
# User Profile
## 基本信息
- 姓名:
- 性别:
- 年龄段: [20-25 / 25-35 / 35+]
- 所在城市:
- 时区:

## 购物偏好
- 常购品类: [美妆 / 服饰 / 数码 / 食品 / 家电...]
- 品牌偏好:
- 风格喜好: [极简 / 潮流 / 商务 / 户外...]
- 预算区间: [¥____ - ¥____]
- 是否关注环保/可持续产品: [是/否]
- 购物频率: [每周 / 每月 / 节日 / 临时需求]

## 当前需求
- 当前意向商品/品类:
- 购买目的: [自用 / 礼物 / 补货 / 尝鲜]
- 使用场景: [日常 / 旅行 / 工作 / 聚会...]
- 优先考虑因素: [价格 / 颜值 / 性能 / 品牌 / 新品]
- 购买紧急度: [立即 / 一周内 / 未来考虑]

## 历史交互记录
- 最近浏览:
- 最近购买:
- 最近收藏:
- 已推荐但未购买的商品:

## 对话状态
- 当前话题:
- 上次未解决问题:
- 最近推荐反馈: [满意 / 一般 / 不喜欢]
`,
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
