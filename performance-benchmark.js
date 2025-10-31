#!/usr/bin/env node

/**
 * Mastra记忆系统性能基准测试
 * 测试记忆系统在不同负载下的性能表现
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';

// 测试配置
const TEST_CONFIG = {
  // 并发测试配置
  concurrency: {
    low: 5,      // 低并发
    medium: 15,  // 中等并发
    high: 30     // 高并发
  },
  // 测试持续时间（秒）
  duration: 30,
  // 记忆测试数据
  memoryTestData: [
    { userId: 'user1', preference: '喜欢节能家电', budget: '5000-8000元' },
    { userId: 'user2', preference: '偏爱智能功能', budget: '8000-12000元' },
    { userId: 'user3', preference: '注重品牌质量', budget: '10000-15000元' },
    { userId: 'user4', preference: '追求性价比', budget: '3000-5000元' },
    { userId: 'user5', preference: '喜欢简约设计', budget: '6000-9000元' }
  ]
};

class PerformanceBenchmark {
  constructor() {
    this.results = {
      apiLatency: [],
      memoryOperations: [],
      concurrencyTests: {},
      errors: []
    };
  }

  // 测试API延迟
  async testApiLatency(iterations = 50) {
    console.log(`\n🚀 测试API延迟 (${iterations}次请求)...`);
    
    const latencies = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        await axios.get(`${BASE_URL}/api/agents`);
        const end = performance.now();
        const latency = end - start;
        latencies.push(latency);
        
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`\r进度: ${i + 1}/${iterations}`);
        }
      } catch (error) {
        this.results.errors.push({
          test: 'apiLatency',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('\n');
    
    this.results.apiLatency = {
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95: this.percentile(latencies, 95),
      p99: this.percentile(latencies, 99)
    };
    
    console.log('📊 API延迟统计:');
    console.log(`   最小值: ${this.results.apiLatency.min.toFixed(2)}ms`);
    console.log(`   最大值: ${this.results.apiLatency.max.toFixed(2)}ms`);
    console.log(`   平均值: ${this.results.apiLatency.avg.toFixed(2)}ms`);
    console.log(`   P95: ${this.results.apiLatency.p95.toFixed(2)}ms`);
    console.log(`   P99: ${this.results.apiLatency.p99.toFixed(2)}ms`);
  }

  // 测试记忆操作性能
  async testMemoryOperations() {
    console.log('\n🧠 测试记忆操作性能...');
    
    const operations = [];
    
    for (const testData of TEST_CONFIG.memoryTestData) {
      // 测试记忆写入
      const writeStart = performance.now();
      try {
        await this.sendAgentMessage('recommendationAgent', 
          `我是${testData.userId}，我的偏好是${testData.preference}，预算${testData.budget}`);
        const writeEnd = performance.now();
        
        operations.push({
          type: 'write',
          userId: testData.userId,
          duration: writeEnd - writeStart
        });
        
        // 等待一秒确保记忆写入
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 测试记忆读取
        const readStart = performance.now();
        await this.sendAgentMessage('recommendationAgent', 
          `根据我之前的偏好推荐产品`);
        const readEnd = performance.now();
        
        operations.push({
          type: 'read',
          userId: testData.userId,
          duration: readEnd - readStart
        });
        
      } catch (error) {
        this.results.errors.push({
          test: 'memoryOperations',
          userId: testData.userId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const writeOps = operations.filter(op => op.type === 'write');
    const readOps = operations.filter(op => op.type === 'read');
    
    this.results.memoryOperations = {
      write: {
        count: writeOps.length,
        avgDuration: writeOps.reduce((sum, op) => sum + op.duration, 0) / writeOps.length
      },
      read: {
        count: readOps.length,
        avgDuration: readOps.reduce((sum, op) => sum + op.duration, 0) / readOps.length
      }
    };
    
    console.log('📊 记忆操作统计:');
    console.log(`   写入操作: ${this.results.memoryOperations.write.count}次, 平均耗时: ${this.results.memoryOperations.write.avgDuration.toFixed(2)}ms`);
    console.log(`   读取操作: ${this.results.memoryOperations.read.count}次, 平均耗时: ${this.results.memoryOperations.read.avgDuration.toFixed(2)}ms`);
  }

  // 测试并发性能
  async testConcurrency(level = 'medium') {
    const concurrency = TEST_CONFIG.concurrency[level];
    console.log(`\n⚡ 测试${level}并发性能 (${concurrency}个并发请求)...`);
    
    const startTime = performance.now();
    const promises = [];
    const results = [];
    
    for (let i = 0; i < concurrency; i++) {
      const promise = this.sendAgentMessage('recommendationAgent', 
        `并发测试请求 ${i + 1}，推荐一台洗衣机`)
        .then(response => {
          results.push({
            requestId: i + 1,
            success: true,
            responseLength: response.length,
            timestamp: performance.now()
          });
        })
        .catch(error => {
          results.push({
            requestId: i + 1,
            success: false,
            error: error.message,
            timestamp: performance.now()
          });
        });
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
    const endTime = performance.now();
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    this.results.concurrencyTests[level] = {
      concurrency,
      totalTime: endTime - startTime,
      successCount,
      errorCount,
      successRate: (successCount / concurrency) * 100,
      throughput: (successCount / ((endTime - startTime) / 1000)).toFixed(2)
    };
    
    console.log('📊 并发测试结果:');
    console.log(`   总耗时: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`   成功请求: ${successCount}/${concurrency}`);
    console.log(`   成功率: ${this.results.concurrencyTests[level].successRate.toFixed(2)}%`);
    console.log(`   吞吐量: ${this.results.concurrencyTests[level].throughput} 请求/秒`);
  }

  // 发送代理消息
  async sendAgentMessage(agentName, message) {
    const response = await axios.post(`${BASE_URL}/api/agents/${agentName}/stream`, {
      messages: [{ role: 'user', content: message }]
    });
    
    return response.data;
  }

  // 计算百分位数
  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    
    if (Math.floor(index) === index) {
      return sorted[index];
    } else {
      const lower = sorted[Math.floor(index)];
      const upper = sorted[Math.ceil(index)];
      return lower + (upper - lower) * (index - Math.floor(index));
    }
  }

  // 生成性能报告
  generateReport() {
    console.log('\n📋 ===== 性能基准测试报告 =====');
    console.log(`测试时间: ${new Date().toISOString()}`);
    
    if (this.results.apiLatency.avg) {
      console.log('\n🚀 API延迟性能:');
      console.log(`   平均响应时间: ${this.results.apiLatency.avg.toFixed(2)}ms`);
      console.log(`   P95响应时间: ${this.results.apiLatency.p95.toFixed(2)}ms`);
      console.log(`   P99响应时间: ${this.results.apiLatency.p99.toFixed(2)}ms`);
    }
    
    if (this.results.memoryOperations.write) {
      console.log('\n🧠 记忆操作性能:');
      console.log(`   记忆写入平均耗时: ${this.results.memoryOperations.write.avgDuration.toFixed(2)}ms`);
      console.log(`   记忆读取平均耗时: ${this.results.memoryOperations.read.avgDuration.toFixed(2)}ms`);
    }
    
    Object.entries(this.results.concurrencyTests).forEach(([level, data]) => {
      console.log(`\n⚡ ${level}并发性能:`);
      console.log(`   并发数: ${data.concurrency}`);
      console.log(`   成功率: ${data.successRate.toFixed(2)}%`);
      console.log(`   吞吐量: ${data.throughput} 请求/秒`);
    });
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ 错误统计:');
      console.log(`   总错误数: ${this.results.errors.length}`);
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.test}] ${error.error}`);
      });
    }
    
    console.log('\n✅ 性能基准测试完成！');
  }

  // 运行完整测试套件
  async runFullBenchmark() {
    console.log('🎯 开始Mastra记忆系统性能基准测试...\n');
    
    try {
      // 1. API延迟测试
      await this.testApiLatency(30);
      
      // 2. 记忆操作性能测试
      await this.testMemoryOperations();
      
      // 3. 低并发测试
      await this.testConcurrency('low');
      
      // 4. 中等并发测试
      await this.testConcurrency('medium');
      
      // 5. 生成报告
      this.generateReport();
      
    } catch (error) {
      console.error('❌ 基准测试过程中发生错误:', error.message);
      this.results.errors.push({
        test: 'fullBenchmark',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// 主函数
async function main() {
  const benchmark = new PerformanceBenchmark();
  
  // 检查服务器是否运行
  try {
    await axios.get(`${BASE_URL}/api/agents`);
    console.log('✅ Mastra服务器连接正常');
  } catch (error) {
    console.error('❌ 无法连接到Mastra服务器，请确保服务器正在运行');
    process.exit(1);
  }
  
  await benchmark.runFullBenchmark();
}

// 运行测试
main().catch(console.error);

export default PerformanceBenchmark;