// {{RIPER-5:
//   Action: "Modified"
//   Task_ID: "implement-memory-agents"
//   Timestamp: "2025-01-27T11:00:00Z"
//   Authoring_Role: "LD"
//   Principle_Applied: "SOLID-S (单一职责原则)"
//   Quality_Check: "更新Mastra配置以使用新的记忆代理"
// }}
// {{START_MODIFICATIONS}}

import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";
import { PinoLogger } from "@mastra/loggers";

import { agents } from "./agents";
import { tools } from "./tools";
import { workflows } from "./workflows";
import { getMemoryOptimizationConfig } from "../config/memory-optimization";
import { memoryPerformanceMonitor } from "../utils/memory-performance-monitor";

// 获取性能优化配置
const optimizationConfig = getMemoryOptimizationConfig();

// PostgreSQL配置（包含性能优化）
const postgresConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  user: "postgres",
  password: "postgres",
  database: "postgres",
  // 连接池优化配置
  min: optimizationConfig.connectionPool.min,
  max: optimizationConfig.connectionPool.max,
  idleTimeoutMillis: optimizationConfig.connectionPool.idleTimeoutMillis,
  connectionTimeoutMillis: optimizationConfig.connectionPool.connectionTimeoutMillis,
  acquireTimeoutMillis: optimizationConfig.connectionPool.acquireTimeoutMillis,
  // 查询优化配置
  statement_timeout: optimizationConfig.query.timeoutMs,
  query_timeout: optimizationConfig.query.timeoutMs,
};

export const mastra = new Mastra({
  agents,
  workflows,
  storage: new PostgresStore(postgresConfig),
  logger: new PinoLogger({
    level: optimizationConfig.monitoring.enabled ? "debug" : "info",
  }),
  observability: {
    default: { 
      enabled: optimizationConfig.monitoring.enabled,
    },
  },
});

// 启用性能监控
if (optimizationConfig.monitoring.enabled) {
  // 监听性能警告
  memoryPerformanceMonitor.on('warning', (warning) => {
    console.warn(`[性能警告] ${warning.type}: ${warning.message}`, {
      value: warning.value,
      threshold: warning.threshold,
    });
  });

  // 监听慢查询
  memoryPerformanceMonitor.on('slowQuery', (data) => {
    console.warn(`[慢查询] 查询耗时 ${data.duration}ms，超过阈值 ${data.threshold}ms`);
  });

  // 定期输出性能报告（仅在开发环境）
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      console.log(memoryPerformanceMonitor.getPerformanceReport());
    }, 300000); // 每5分钟输出一次
  }
}

// {{END_MODIFICATIONS}}

// 导出所有模块
export * from "./agents";
export * from "./workflows";
export * from "./tools";
export * from "./memory";
