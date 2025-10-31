// {{RIPER-5:
//   Action: "Added"
//   Task_ID: "optimize-memory-performance"
//   Timestamp: "2025-01-27T11:30:00Z"
//   Authoring_Role: "LD"
//   Principle_Applied: "SOLID-S (单一职责原则)"
//   Quality_Check: "创建记忆系统性能优化配置"
// }}
// {{START_MODIFICATIONS}}

/**
 * Mastra记忆系统性能优化配置
 * 
 * 该配置文件包含了针对PostgreSQL记忆存储的性能优化设置，
 * 包括连接池、缓存、批处理和查询优化等配置。
 */

export interface MemoryOptimizationConfig {
  // PostgreSQL连接池优化
  connectionPool: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
    acquireTimeoutMillis: number;
  };
  
  // 记忆查询缓存配置
  cache: {
    enabled: boolean;
    ttl: number; // 缓存生存时间（秒）
    maxSize: number; // 最大缓存条目数
    strategy: 'lru' | 'lfu' | 'fifo';
  };
  
  // 批处理配置
  batch: {
    enabled: boolean;
    size: number; // 批处理大小
    timeout: number; // 批处理超时时间（毫秒）
    maxWaitTime: number; // 最大等待时间（毫秒）
  };
  
  // 查询优化配置
  query: {
    enablePreparedStatements: boolean;
    maxQueryComplexity: number;
    timeoutMs: number;
    enableQueryPlan: boolean;
  };
  
  // 记忆压缩配置
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'lz4' | 'snappy';
    threshold: number; // 压缩阈值（字节）
  };
  
  // 性能监控配置
  monitoring: {
    enabled: boolean;
    metricsInterval: number; // 指标收集间隔（秒）
    slowQueryThreshold: number; // 慢查询阈值（毫秒）
    enableDetailedMetrics: boolean;
  };
}

// 生产环境优化配置
export const productionConfig: MemoryOptimizationConfig = {
  connectionPool: {
    min: 5,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    acquireTimeoutMillis: 10000,
  },
  cache: {
    enabled: true,
    ttl: 3600, // 1小时
    maxSize: 10000,
    strategy: 'lru',
  },
  batch: {
    enabled: true,
    size: 100,
    timeout: 1000,
    maxWaitTime: 5000,
  },
  query: {
    enablePreparedStatements: true,
    maxQueryComplexity: 1000,
    timeoutMs: 30000,
    enableQueryPlan: false,
  },
  compression: {
    enabled: true,
    algorithm: 'gzip',
    threshold: 1024, // 1KB
  },
  monitoring: {
    enabled: true,
    metricsInterval: 60,
    slowQueryThreshold: 1000,
    enableDetailedMetrics: true,
  },
};

// 开发环境配置
export const developmentConfig: MemoryOptimizationConfig = {
  connectionPool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 3000,
    acquireTimeoutMillis: 5000,
  },
  cache: {
    enabled: true,
    ttl: 1800, // 30分钟
    maxSize: 1000,
    strategy: 'lru',
  },
  batch: {
    enabled: false, // 开发环境禁用批处理以便调试
    size: 50,
    timeout: 500,
    maxWaitTime: 2000,
  },
  query: {
    enablePreparedStatements: true,
    maxQueryComplexity: 500,
    timeoutMs: 10000,
    enableQueryPlan: true, // 开发环境启用查询计划分析
  },
  compression: {
    enabled: false, // 开发环境禁用压缩以便调试
    algorithm: 'gzip',
    threshold: 2048,
  },
  monitoring: {
    enabled: true,
    metricsInterval: 30,
    slowQueryThreshold: 500,
    enableDetailedMetrics: true,
  },
};

// 测试环境配置
export const testConfig: MemoryOptimizationConfig = {
  connectionPool: {
    min: 1,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 2000,
    acquireTimeoutMillis: 3000,
  },
  cache: {
    enabled: false, // 测试环境禁用缓存确保数据一致性
    ttl: 300,
    maxSize: 100,
    strategy: 'fifo',
  },
  batch: {
    enabled: false,
    size: 10,
    timeout: 100,
    maxWaitTime: 500,
  },
  query: {
    enablePreparedStatements: false,
    maxQueryComplexity: 100,
    timeoutMs: 5000,
    enableQueryPlan: false,
  },
  compression: {
    enabled: false,
    algorithm: 'gzip',
    threshold: 4096,
  },
  monitoring: {
    enabled: false,
    metricsInterval: 10,
    slowQueryThreshold: 100,
    enableDetailedMetrics: false,
  },
};

// 根据环境获取配置
export function getMemoryOptimizationConfig(): MemoryOptimizationConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// 性能指标接口
export interface MemoryPerformanceMetrics {
  connectionPool: {
    active: number;
    idle: number;
    waiting: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  queries: {
    total: number;
    slow: number;
    avgResponseTime: number;
    errors: number;
  };
  memory: {
    used: number;
    available: number;
    usage: number;
  };
}

// {{END_MODIFICATIONS}}