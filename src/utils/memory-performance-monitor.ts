// {{RIPER-5:
//   Action: "Added"
//   Task_ID: "optimize-memory-performance"
//   Timestamp: "2025-01-27T11:35:00Z"
//   Authoring_Role: "LD"
//   Principle_Applied: "SOLID-S (单一职责原则)"
//   Quality_Check: "创建记忆系统性能监控工具"
// }}
// {{START_MODIFICATIONS}}

import { EventEmitter } from 'events';
import { MemoryPerformanceMetrics, getMemoryOptimizationConfig } from '../config/memory-optimization';

/**
 * Mastra记忆系统性能监控器
 * 
 * 该类负责监控记忆系统的性能指标，包括：
 * - 数据库连接池状态
 * - 查询性能统计
 * - 缓存命中率
 * - 内存使用情况
 */
export class MemoryPerformanceMonitor extends EventEmitter {
  private metrics: MemoryPerformanceMetrics;
  private config = getMemoryOptimizationConfig();
  private monitoringInterval?: NodeJS.Timeout;
  private queryTimes: number[] = [];
  private slowQueries: number = 0;
  private totalQueries: number = 0;
  private queryErrors: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    
    if (this.config.monitoring.enabled) {
      this.startMonitoring();
    }
  }

  private initializeMetrics(): MemoryPerformanceMetrics {
    return {
      connectionPool: {
        active: 0,
        idle: 0,
        waiting: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
      },
      queries: {
        total: 0,
        slow: 0,
        avgResponseTime: 0,
        errors: 0,
      },
      memory: {
        used: 0,
        available: 0,
        usage: 0,
      },
    };
  }

  /**
   * 开始性能监控
   */
  public startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.emit('metrics', this.metrics);
      
      // 检查性能阈值
      this.checkPerformanceThresholds();
    }, this.config.monitoring.metricsInterval * 1000);

    console.log(`记忆系统性能监控已启动，间隔: ${this.config.monitoring.metricsInterval}秒`);
  }

  /**
   * 停止性能监控
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('记忆系统性能监控已停止');
    }
  }

  /**
   * 记录查询性能
   */
  public recordQuery(duration: number, isError: boolean = false): void {
    this.totalQueries++;
    this.queryTimes.push(duration);
    
    if (isError) {
      this.queryErrors++;
    }
    
    if (duration > this.config.monitoring.slowQueryThreshold) {
      this.slowQueries++;
      this.emit('slowQuery', { duration, threshold: this.config.monitoring.slowQueryThreshold });
    }

    // 保持查询时间数组大小在合理范围内
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-500);
    }
  }

  /**
   * 记录缓存命中
   */
  public recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * 记录缓存未命中
   */
  public recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * 更新连接池状态
   */
  public updateConnectionPoolStatus(active: number, idle: number, waiting: number): void {
    this.metrics.connectionPool = { active, idle, waiting };
  }

  /**
   * 更新缓存大小
   */
  public updateCacheSize(size: number): void {
    this.metrics.cache.size = size;
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    // 更新查询指标
    this.metrics.queries.total = this.totalQueries;
    this.metrics.queries.slow = this.slowQueries;
    this.metrics.queries.errors = this.queryErrors;
    this.metrics.queries.avgResponseTime = this.calculateAverageQueryTime();

    // 更新缓存指标
    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    this.metrics.cache.hits = this.cacheHits;
    this.metrics.cache.misses = this.cacheMisses;
    this.metrics.cache.hitRate = totalCacheRequests > 0 ? this.cacheHits / totalCacheRequests : 0;

    // 更新内存指标
    const memUsage = process.memoryUsage();
    this.metrics.memory.used = memUsage.heapUsed;
    this.metrics.memory.available = memUsage.heapTotal;
    this.metrics.memory.usage = memUsage.heapUsed / memUsage.heapTotal;
  }

  /**
   * 计算平均查询时间
   */
  private calculateAverageQueryTime(): number {
    if (this.queryTimes.length === 0) {
      return 0;
    }
    
    const sum = this.queryTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.queryTimes.length;
  }

  /**
   * 检查性能阈值
   */
  private checkPerformanceThresholds(): void {
    const { metrics } = this;
    
    // 检查缓存命中率
    if (metrics.cache.hitRate < 0.8 && this.cacheHits + this.cacheMisses > 100) {
      this.emit('warning', {
        type: 'low_cache_hit_rate',
        value: metrics.cache.hitRate,
        threshold: 0.8,
        message: '缓存命中率过低，建议检查缓存策略',
      });
    }

    // 检查慢查询比例
    const slowQueryRate = metrics.queries.total > 0 ? metrics.queries.slow / metrics.queries.total : 0;
    if (slowQueryRate > 0.1) {
      this.emit('warning', {
        type: 'high_slow_query_rate',
        value: slowQueryRate,
        threshold: 0.1,
        message: '慢查询比例过高，建议优化查询或增加索引',
      });
    }

    // 检查内存使用率
    if (metrics.memory.usage > 0.9) {
      this.emit('warning', {
        type: 'high_memory_usage',
        value: metrics.memory.usage,
        threshold: 0.9,
        message: '内存使用率过高，建议检查内存泄漏或增加内存',
      });
    }

    // 检查连接池使用率
    const totalConnections = metrics.connectionPool.active + metrics.connectionPool.idle;
    const poolUsage = totalConnections / this.config.connectionPool.max;
    if (poolUsage > 0.8) {
      this.emit('warning', {
        type: 'high_connection_pool_usage',
        value: poolUsage,
        threshold: 0.8,
        message: '连接池使用率过高，建议增加连接池大小',
      });
    }
  }

  /**
   * 获取当前性能指标
   */
  public getMetrics(): MemoryPerformanceMetrics {
    this.collectMetrics();
    return { ...this.metrics };
  }

  /**
   * 获取性能报告
   */
  public getPerformanceReport(): string {
    const metrics = this.getMetrics();
    
    return `
=== Mastra记忆系统性能报告 ===
时间: ${new Date().toISOString()}

连接池状态:
  活跃连接: ${metrics.connectionPool.active}
  空闲连接: ${metrics.connectionPool.idle}
  等待连接: ${metrics.connectionPool.waiting}

查询性能:
  总查询数: ${metrics.queries.total}
  慢查询数: ${metrics.queries.slow}
  平均响应时间: ${metrics.queries.avgResponseTime.toFixed(2)}ms
  错误数: ${metrics.queries.errors}

缓存性能:
  命中数: ${metrics.cache.hits}
  未命中数: ${metrics.cache.misses}
  命中率: ${(metrics.cache.hitRate * 100).toFixed(2)}%
  缓存大小: ${metrics.cache.size}

内存使用:
  已使用: ${(metrics.memory.used / 1024 / 1024).toFixed(2)}MB
  总可用: ${(metrics.memory.available / 1024 / 1024).toFixed(2)}MB
  使用率: ${(metrics.memory.usage * 100).toFixed(2)}%
================================
    `.trim();
  }

  /**
   * 重置统计数据
   */
  public resetStats(): void {
    this.queryTimes = [];
    this.slowQueries = 0;
    this.totalQueries = 0;
    this.queryErrors = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.metrics = this.initializeMetrics();
    
    console.log('性能统计数据已重置');
  }

  /**
   * 销毁监控器
   */
  public destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}

// 单例实例
export const memoryPerformanceMonitor = new MemoryPerformanceMonitor();

// {{END_MODIFICATIONS}}