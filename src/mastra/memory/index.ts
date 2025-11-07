import { Memory } from "@mastra/memory";
import { fastembed } from "@mastra/fastembed";
import { deepseek } from "../providers/deepseek";
import { ToolCallFilter, TokenLimiter } from "@mastra/memory/processors";
import { postgres } from "../../database/postgres";
import { pgVector } from "../../database/pgVector";
import { volcengine } from "../providers/volcengine";

export const memory = new Memory({
  storage: postgres,
  // processors: [
  //   new ToolCallFilter(), // 删除所有工具调用消息
  //   new ToolCallFilter({ exclude: ["generateImageTool"] }), // 仅排除图像生成工具
  //   new TokenLimiter(127000), // 放在最后
  // ],
  vector: pgVector,

  embedder: volcengine.embedding("ep-20251016153453-g2d58"),
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
      template: ``,
    },
    // 线程配置
    threads: {
      generateTitle: true, // 自动生成线程标题
    },
  },
});
