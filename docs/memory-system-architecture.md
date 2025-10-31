# Mastra记忆系统架构文档

## 概述

本项目已成功升级到基于Mastra框架的新记忆系统，提供了更强大的记忆管理和持久化能力。

## 架构组件

### 1. 记忆存储后端
- **数据库**: PostgreSQL
- **连接配置**: 通过环境变量配置
- **持久化**: 所有记忆数据存储在PostgreSQL中

### 2. 代理系统
- **推荐代理** (`recommendationAgent`): 提供个性化推荐服务
- **家电代理** (`applianceAgent`): 专门处理家电相关查询
- **记忆集成**: 两个代理都集成了记忆功能

### 3. 工作流系统
- **记忆工作流** (`memoryWorkflowNew`): 处理复杂的记忆相关任务
- **步骤化处理**: 支持多步骤记忆操作

## 技术特性

### 记忆管理
- **自动记忆**: 代理自动记录用户偏好和交互历史
- **上下文感知**: 基于历史记忆提供个性化响应
- **持久化存储**: 记忆数据永久保存在PostgreSQL中

### API端点
- **代理API**: `/api/agents/{agentName}/stream`
- **工作流API**: `/api/workflows/{workflowName}/run`
- **Swagger UI**: `/swagger-ui` (API文档)

### 模型配置
- **LLM提供商**: 火山引擎 (Volcengine)
- **模型**: `ep-m-20251024161251-sjljb`
- **API配置**: 通过环境变量管理

## 部署配置

### 环境变量
```env
# 数据库配置
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# API密钥
ARK_API_KEY=your_volcengine_api_key_here
OPENAI_API_KEY=your-openai-api-key

# 服务器配置
PORT=3000
```

### 启动命令
```bash
npm run dev
```

## 测试验证

### 集成测试
- **测试脚本**: `test-memory-system.js`
- **覆盖范围**: 
  - API连接测试
  - 代理功能测试
  - 记忆持久化测试
  - PostgreSQL连接验证

### 测试结果
- ✅ 所有测试通过
- ✅ 记忆系统正常运行
- ✅ PostgreSQL连接稳定

## 迁移说明

### 从旧系统迁移
1. 旧的SQLite记忆系统已被PostgreSQL替代
2. 代理配置已更新为使用Mastra框架
3. 工作流系统已重构为新的记忆工作流

### 兼容性
- 保持了原有的功能接口
- 提升了性能和可扩展性
- 增强了记忆管理能力

## 维护指南

### 监控
- 检查PostgreSQL连接状态
- 监控代理响应时间
- 验证记忆数据完整性

### 故障排除
1. **数据库连接问题**: 检查DATABASE_URL配置
2. **API密钥错误**: 验证ARK_API_KEY设置
3. **代理响应异常**: 查看服务器日志

## 更新日志

### v2.0.0 (当前版本)
- 升级到Mastra框架
- 集成PostgreSQL作为记忆存储
- 重构代理和工作流系统
- 完成全面集成测试

### v1.0.0 (旧版本)
- 基于SQLite的记忆系统
- 简单的代理实现
- 基础工作流支持