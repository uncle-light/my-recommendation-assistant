#!/usr/bin/env node

/**
 * Mastra记忆系统监控和告警设置
 * 监控系统健康状态、性能指标和错误率
 */

import axios from 'axios';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const MONITORING_CONFIG = {
  // 监控间隔（毫秒）
  interval: 30000, // 30秒
  // 告警阈值
  thresholds: {
    responseTime: 5000,    // 响应时间超过5秒告警
    errorRate: 0.1,        // 错误率超过10%告警
    memoryUsage: 0.8,      // 内存使用率超过80%告警
    cpuUsage: 0.8          // CPU使用率超过80%告警
  },
  // 日志文件路径
  logFile: './monitoring.log',
  // 告警历史文件
  alertFile: './alerts.log'
};

class SystemMonitor {
  constructor() {
    this.metrics = {
      uptime: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimeHistory: [],
      alerts: []
    };
    this.isRunning = false;
  }

  // 启动监控
  async start() {
    console.log('🚀 启动Mastra记忆系统监控...');
    this.isRunning = true;
    
    // 创建监控日志文件
    await this.initializeLogFiles();
    
    // 开始监控循环
    this.monitoringLoop();
    
    console.log(`✅ 监控已启动，间隔: ${MONITORING_CONFIG.interval / 1000}秒`);
    console.log('📊 监控指标: 响应时间、错误率、系统健康状态');
    console.log('🔔 告警阈值:');
    console.log(`   - 响应时间: ${MONITORING_CONFIG.thresholds.responseTime}ms`);
    console.log(`   - 错误率: ${MONITORING_CONFIG.thresholds.errorRate * 100}%`);
    console.log('按 Ctrl+C 停止监控\n');
  }

  // 停止监控
  stop() {
    this.isRunning = false;
    console.log('\n🛑 监控已停止');
    this.generateSummaryReport();
  }

  // 初始化日志文件
  async initializeLogFiles() {
    const timestamp = new Date().toISOString();
    
    // 创建监控日志头部
    const logHeader = `# Mastra记忆系统监控日志\n# 开始时间: ${timestamp}\n# 监控间隔: ${MONITORING_CONFIG.interval / 1000}秒\n\n`;
    await fs.writeFile(MONITORING_CONFIG.logFile, logHeader);
    
    // 创建告警日志头部
    const alertHeader = `# Mastra记忆系统告警日志\n# 开始时间: ${timestamp}\n\n`;
    await fs.writeFile(MONITORING_CONFIG.alertFile, alertHeader);
  }

  // 监控循环
  async monitoringLoop() {
    while (this.isRunning) {
      try {
        await this.performHealthCheck();
        await this.sleep(MONITORING_CONFIG.interval);
      } catch (error) {
        console.error('❌ 监控过程中发生错误:', error.message);
        await this.logAlert('MONITOR_ERROR', error.message);
      }
    }
  }

  // 执行健康检查
  async performHealthCheck() {
    const timestamp = new Date().toISOString();
    const startTime = performance.now();
    
    try {
      // 测试API连接
      const response = await axios.get(`${BASE_URL}/api/agents`, {
        timeout: 10000
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // 更新指标
      this.metrics.totalRequests++;
      this.metrics.successfulRequests++;
      this.metrics.responseTimeHistory.push(responseTime);
      
      // 保持历史记录在合理范围内
      if (this.metrics.responseTimeHistory.length > 100) {
        this.metrics.responseTimeHistory.shift();
      }
      
      // 检查响应时间告警
      if (responseTime > MONITORING_CONFIG.thresholds.responseTime) {
        await this.triggerAlert('HIGH_RESPONSE_TIME', 
          `响应时间过高: ${responseTime.toFixed(2)}ms (阈值: ${MONITORING_CONFIG.thresholds.responseTime}ms)`);
      }
      
      // 计算错误率
      const errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
      
      // 检查错误率告警
      if (errorRate > MONITORING_CONFIG.thresholds.errorRate) {
        await this.triggerAlert('HIGH_ERROR_RATE', 
          `错误率过高: ${(errorRate * 100).toFixed(2)}% (阈值: ${MONITORING_CONFIG.thresholds.errorRate * 100}%)`);
      }
      
      // 记录监控数据
      await this.logMetrics(timestamp, responseTime, errorRate);
      
      // 显示实时状态
      this.displayStatus(responseTime, errorRate);
      
    } catch (error) {
      this.metrics.totalRequests++;
      this.metrics.failedRequests++;
      
      await this.triggerAlert('API_ERROR', `API请求失败: ${error.message}`);
      console.log(`❌ [${timestamp}] API健康检查失败: ${error.message}`);
    }
  }

  // 触发告警
  async triggerAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      count: 1
    };
    
    // 检查是否是重复告警
    const existingAlert = this.metrics.alerts.find(a => 
      a.type === type && a.message === message && 
      (Date.now() - new Date(a.timestamp).getTime()) < 300000 // 5分钟内
    );
    
    if (existingAlert) {
      existingAlert.count++;
      return;
    }
    
    this.metrics.alerts.push(alert);
    
    // 记录告警
    await this.logAlert(type, message);
    
    // 显示告警
    console.log(`🚨 [${alert.timestamp}] 告警: ${type} - ${message}`);
  }

  // 记录指标
  async logMetrics(timestamp, responseTime, errorRate) {
    const avgResponseTime = this.metrics.responseTimeHistory.reduce((a, b) => a + b, 0) / 
                           this.metrics.responseTimeHistory.length;
    
    const logEntry = `${timestamp},${responseTime.toFixed(2)},${avgResponseTime.toFixed(2)},${(errorRate * 100).toFixed(2)},${this.metrics.totalRequests},${this.metrics.successfulRequests},${this.metrics.failedRequests}\n`;
    
    await fs.appendFile(MONITORING_CONFIG.logFile, logEntry);
  }

  // 记录告警
  async logAlert(type, message) {
    const timestamp = new Date().toISOString();
    const alertEntry = `${timestamp} [${type}] ${message}\n`;
    
    await fs.appendFile(MONITORING_CONFIG.alertFile, alertEntry);
  }

  // 显示实时状态
  displayStatus(responseTime, errorRate) {
    const avgResponseTime = this.metrics.responseTimeHistory.reduce((a, b) => a + b, 0) / 
                           this.metrics.responseTimeHistory.length;
    
    // 清除控制台并显示状态
    process.stdout.write('\r\x1b[K'); // 清除当前行
    process.stdout.write(
      `📊 状态: ✅ 正常 | ` +
      `响应时间: ${responseTime.toFixed(2)}ms (平均: ${avgResponseTime.toFixed(2)}ms) | ` +
      `错误率: ${(errorRate * 100).toFixed(2)}% | ` +
      `总请求: ${this.metrics.totalRequests} | ` +
      `告警: ${this.metrics.alerts.length}`
    );
  }

  // 生成总结报告
  generateSummaryReport() {
    console.log('\n📋 ===== 监控总结报告 =====');
    console.log(`监控时长: ${Math.floor(this.metrics.uptime / 60000)}分钟`);
    console.log(`总请求数: ${this.metrics.totalRequests}`);
    console.log(`成功请求: ${this.metrics.successfulRequests}`);
    console.log(`失败请求: ${this.metrics.failedRequests}`);
    
    if (this.metrics.responseTimeHistory.length > 0) {
      const avgResponseTime = this.metrics.responseTimeHistory.reduce((a, b) => a + b, 0) / 
                             this.metrics.responseTimeHistory.length;
      const minResponseTime = Math.min(...this.metrics.responseTimeHistory);
      const maxResponseTime = Math.max(...this.metrics.responseTimeHistory);
      
      console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`最小响应时间: ${minResponseTime.toFixed(2)}ms`);
      console.log(`最大响应时间: ${maxResponseTime.toFixed(2)}ms`);
    }
    
    const errorRate = this.metrics.totalRequests > 0 ? 
                     (this.metrics.failedRequests / this.metrics.totalRequests) * 100 : 0;
    console.log(`总体错误率: ${errorRate.toFixed(2)}%`);
    
    console.log(`触发告警数: ${this.metrics.alerts.length}`);
    
    if (this.metrics.alerts.length > 0) {
      console.log('\n🚨 告警详情:');
      this.metrics.alerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. [${alert.type}] ${alert.message} (${alert.count}次)`);
      });
    }
    
    console.log(`\n📄 详细日志: ${MONITORING_CONFIG.logFile}`);
    console.log(`📄 告警日志: ${MONITORING_CONFIG.alertFile}`);
  }

  // 睡眠函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 测试记忆系统特定功能
class MemorySystemMonitor extends SystemMonitor {
  constructor() {
    super();
    this.memoryTestCases = [
      { agent: 'recommendationAgent', message: '监控测试：推荐一台洗衣机' },
      { agent: 'applianceAgent', message: '监控测试：查询冰箱信息' }
    ];
  }

  // 执行记忆系统特定检查
  async performMemoryHealthCheck() {
    console.log('\n🧠 执行记忆系统专项检查...');
    
    for (const testCase of this.memoryTestCases) {
      try {
        const startTime = performance.now();
        
        const response = await axios.post(`${BASE_URL}/api/agents/${testCase.agent}/stream`, {
          messages: [{ role: 'user', content: testCase.message }]
        }, { timeout: 30000 });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        console.log(`✅ ${testCase.agent}: ${responseTime.toFixed(2)}ms`);
        
        // 检查响应质量
        if (response.data && response.data.length > 0) {
          console.log(`   响应长度: ${response.data.length} 字符`);
        }
        
      } catch (error) {
        console.log(`❌ ${testCase.agent}: ${error.message}`);
        await this.triggerAlert('MEMORY_SYSTEM_ERROR', 
          `记忆系统错误 (${testCase.agent}): ${error.message}`);
      }
    }
  }

  // 启动记忆系统监控
  async startMemoryMonitoring() {
    console.log('🧠 启动记忆系统专项监控...');
    
    // 先执行一次记忆系统检查
    await this.performMemoryHealthCheck();
    
    // 然后启动常规监控
    await this.start();
  }
}

// 主函数
async function main() {
  const monitor = new MemorySystemMonitor();
  
  // 处理退出信号
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    monitor.stop();
    process.exit(0);
  });
  
  try {
    // 检查服务器是否运行
    await axios.get(`${BASE_URL}/api/agents`);
    console.log('✅ Mastra服务器连接正常');
    
    // 启动监控
    await monitor.startMemoryMonitoring();
    
  } catch (error) {
    console.error('❌ 无法连接到Mastra服务器，请确保服务器正在运行');
    console.error('错误详情:', error.message);
    process.exit(1);
  }
}

// 运行监控
main().catch(console.error);

export default SystemMonitor;