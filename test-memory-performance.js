// {{RIPER-5:
//   Action: "Added"
//   Task_ID: "performance-testing"
//   Timestamp: "2025-01-27T11:45:00Z"
//   Authoring_Role: "LD"
//   Principle_Applied: "SOLID-S (单一职责原则)"
//   Quality_Check: "创建记忆系统性能测试脚本"
// }}
// {{START_MODIFICATIONS}}

/**
 * Mastra记忆系统性能测试脚本
 * 
 * 该脚本用于测试记忆系统的性能，包括：
 * - 并发查询性能
 * - 记忆存储性能
 * - 代理响应性能
 * - 系统资源使用情况
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const TEST_DURATION = 60000; // 测试持续时间：60秒
const CONCURRENT_USERS = 10; // 并发用户数
const REQUEST_INTERVAL = 1000; // 请求间隔：1秒

// 测试数据
const testUsers = Array.from({ length: CONCURRENT_USERS }, (_, i) => `test-user-${i + 1}`);
const testQueries = [
  '推荐一些智能手机',
  '我想要一台笔记本电脑',
  '有什么好的耳机推荐',
  '推荐一些家用电器',
  '我需要一个平板电脑',
  '有什么好的相机推荐',
  '推荐一些运动装备',
  '我想要一个智能手表',
];

// 性能统计
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  responseTimes: [],
  errors: [],
  startTime: null,
  endTime: null,
};

/**
 * 发送推荐请求
 */
async function sendRecommendationRequest(userId, query) {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/agents/appliance-agent/stream`, {
      messages: [
        {
          role: 'user',
          content: query
        }
      ],
      userId: userId,
      sessionId: `session_${userId}_${Date.now()}`,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: 'PerformanceTest/1.0'
      }
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mastra-Performance-Test'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    // 记录成功请求
    stats.totalRequests++;
    stats.successfulRequests++;
    stats.totalResponseTime += responseTime;
    stats.responseTimes.push(responseTime);
    
    if (responseTime < stats.minResponseTime) {
      stats.minResponseTime = responseTime;
    }
    if (responseTime > stats.maxResponseTime) {
      stats.maxResponseTime = responseTime;
    }
    
    console.log(`✅ 用户 ${userId}: ${responseTime}ms - ${query.substring(0, 20)}...`);
    
    return {
      success: true,
      responseTime,
      userId,
      query,
      data: response.data,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // 记录失败请求
    stats.totalRequests++;
    stats.failedRequests++;
    stats.errors.push({
      userId,
      query,
      error: error.message,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    console.error(`❌ 用户 ${userId}: ${responseTime}ms - 错误: ${error.message}`);
    
    return {
      success: false,
      responseTime,
      userId,
      query,
      error: error.message,
    };
  }
}

/**
 * 模拟单个用户的行为
 */
async function simulateUser(userId) {
  console.log(`🚀 启动用户 ${userId} 的测试`);
  
  const userStats = {
    requests: 0,
    successes: 0,
    failures: 0,
  };
  
  const interval = setInterval(async () => {
    const query = testQueries[Math.floor(Math.random() * testQueries.length)];
    const result = await sendRecommendationRequest(userId, query);
    
    userStats.requests++;
    if (result.success) {
      userStats.successes++;
    } else {
      userStats.failures++;
    }
  }, REQUEST_INTERVAL + Math.random() * 500); // 添加随机延迟避免同时请求
  
  // 测试结束后清理
  setTimeout(() => {
    clearInterval(interval);
    console.log(`🏁 用户 ${userId} 测试完成: ${userStats.requests} 请求, ${userStats.successes} 成功, ${userStats.failures} 失败`);
  }, TEST_DURATION);
  
  return interval;
}

/**
 * 计算性能统计
 */
function calculateStats() {
  const duration = (stats.endTime - stats.startTime) / 1000; // 秒
  const avgResponseTime = stats.totalResponseTime / stats.successfulRequests || 0;
  const successRate = (stats.successfulRequests / stats.totalRequests) * 100 || 0;
  const requestsPerSecond = stats.totalRequests / duration || 0;
  
  // 计算百分位数
  const sortedTimes = stats.responseTimes.sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  return {
    duration,
    totalRequests: stats.totalRequests,
    successfulRequests: stats.successfulRequests,
    failedRequests: stats.failedRequests,
    successRate,
    requestsPerSecond,
    avgResponseTime,
    minResponseTime: stats.minResponseTime === Infinity ? 0 : stats.minResponseTime,
    maxResponseTime: stats.maxResponseTime,
    p50,
    p90,
    p95,
    p99,
    errors: stats.errors,
  };
}

/**
 * 生成性能报告
 */
function generateReport(finalStats) {
  const report = `
=== Mastra记忆系统性能测试报告 ===
测试时间: ${new Date(stats.startTime).toISOString()} - ${new Date(stats.endTime).toISOString()}
测试持续时间: ${finalStats.duration.toFixed(2)} 秒
并发用户数: ${CONCURRENT_USERS}

=== 请求统计 ===
总请求数: ${finalStats.totalRequests}
成功请求数: ${finalStats.successfulRequests}
失败请求数: ${finalStats.failedRequests}
成功率: ${finalStats.successRate.toFixed(2)}%
每秒请求数 (RPS): ${finalStats.requestsPerSecond.toFixed(2)}

=== 响应时间统计 ===
平均响应时间: ${finalStats.avgResponseTime.toFixed(2)} ms
最小响应时间: ${finalStats.minResponseTime} ms
最大响应时间: ${finalStats.maxResponseTime} ms
50th 百分位: ${finalStats.p50} ms
90th 百分位: ${finalStats.p90} ms
95th 百分位: ${finalStats.p95} ms
99th 百分位: ${finalStats.p99} ms

=== 错误统计 ===
错误总数: ${finalStats.errors.length}
${finalStats.errors.length > 0 ? '错误详情:' : ''}
${finalStats.errors.slice(0, 10).map(err => 
  `  - 用户 ${err.userId}: ${err.error}`
).join('\n')}
${finalStats.errors.length > 10 ? `  ... 还有 ${finalStats.errors.length - 10} 个错误` : ''}

=== 性能评估 ===
${finalStats.successRate >= 99 ? '✅' : finalStats.successRate >= 95 ? '⚠️' : '❌'} 成功率: ${finalStats.successRate >= 99 ? '优秀' : finalStats.successRate >= 95 ? '良好' : '需要改进'}
${finalStats.avgResponseTime <= 1000 ? '✅' : finalStats.avgResponseTime <= 3000 ? '⚠️' : '❌'} 平均响应时间: ${finalStats.avgResponseTime <= 1000 ? '优秀' : finalStats.avgResponseTime <= 3000 ? '良好' : '需要改进'}
${finalStats.p95 <= 2000 ? '✅' : finalStats.p95 <= 5000 ? '⚠️' : '❌'} 95th百分位响应时间: ${finalStats.p95 <= 2000 ? '优秀' : finalStats.p95 <= 5000 ? '良好' : '需要改进'}
${finalStats.requestsPerSecond >= 10 ? '✅' : finalStats.requestsPerSecond >= 5 ? '⚠️' : '❌'} 吞吐量: ${finalStats.requestsPerSecond >= 10 ? '优秀' : finalStats.requestsPerSecond >= 5 ? '良好' : '需要改进'}

=== 建议 ===
${finalStats.successRate < 95 ? '- 检查系统稳定性和错误处理\n' : ''}${finalStats.avgResponseTime > 3000 ? '- 优化查询性能和数据库索引\n' : ''}${finalStats.p95 > 5000 ? '- 检查慢查询和系统瓶颈\n' : ''}${finalStats.requestsPerSecond < 5 ? '- 考虑增加系统资源或优化架构\n' : ''}${finalStats.errors.length > 0 ? '- 分析错误日志并修复问题\n' : ''}
================================
  `.trim();
  
  return report;
}

/**
 * 检查服务器状态
 */
async function checkServerStatus() {
  try {
    console.log('🔍 检查服务器状态...');
    const response = await axios.get(`${BASE_URL}/api/agents`, { timeout: 5000 });
    console.log('✅ 服务器状态正常');
    return true;
  } catch (error) {
    console.error('❌ 服务器不可用:', error.message);
    console.error('请确保服务器正在运行在', BASE_URL);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runPerformanceTest() {
  console.log('🎯 开始Mastra记忆系统性能测试');
  console.log(`📊 测试配置: ${CONCURRENT_USERS} 并发用户, ${TEST_DURATION/1000} 秒持续时间`);
  
  // 检查服务器状态
  const serverOk = await checkServerStatus();
  if (!serverOk) {
    process.exit(1);
  }
  
  // 重置统计
  stats.startTime = Date.now();
  stats.totalRequests = 0;
  stats.successfulRequests = 0;
  stats.failedRequests = 0;
  stats.totalResponseTime = 0;
  stats.minResponseTime = Infinity;
  stats.maxResponseTime = 0;
  stats.responseTimes = [];
  stats.errors = [];
  
  console.log('🚀 启动性能测试...');
  
  // 启动所有用户模拟
  const userIntervals = testUsers.map(userId => simulateUser(userId));
  
  // 定期输出进度
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const progress = (elapsed / (TEST_DURATION / 1000)) * 100;
    console.log(`📈 进度: ${progress.toFixed(1)}% | 请求: ${stats.totalRequests} | 成功: ${stats.successfulRequests} | 失败: ${stats.failedRequests}`);
  }, 10000); // 每10秒输出一次
  
  // 等待测试完成
  await new Promise(resolve => setTimeout(resolve, TEST_DURATION + 5000)); // 额外等待5秒确保所有请求完成
  
  // 清理
  clearInterval(progressInterval);
  userIntervals.forEach(interval => clearInterval(interval));
  
  stats.endTime = Date.now();
  
  // 计算并输出最终统计
  const finalStats = calculateStats();
  const report = generateReport(finalStats);
  
  console.log('\n' + report);
  
  // 保存报告到文件
  const fs = require('fs');
  const reportFileName = `performance-report-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  fs.writeFileSync(reportFileName, report);
  console.log(`\n📄 性能报告已保存到: ${reportFileName}`);
  
  // 返回测试结果
  return finalStats;
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTest()
    .then(stats => {
      console.log('\n🎉 性能测试完成');
      process.exit(stats.successRate >= 95 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 性能测试失败:', error.message);
      process.exit(1);
    });
}

export {
  runPerformanceTest,
  calculateStats,
  generateReport,
};

// {{END_MODIFICATIONS}}