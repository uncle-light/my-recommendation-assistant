# Mastra.ai 记忆系统架构设计

## 概述
采用Mastra.ai原生记忆系统，替换当前的自定义记忆实现，实现更简洁、高效的记忆管理。

## 核心组件

### 1. 存储层 (Storage Layer)
- **PostgreSQL + pgvector**: 主存储后端
- **Mastra PostgresStore**: 结构化数据存储
- **Mastra PgVector**: 向量嵌入存储和检索

### 2. 记忆管理 (Memory Management)
- **Mastra Memory**: 核心记忆管理器
- **语义召回 (Semantic Recall)**: 基于向量相似度的记忆检索
- **对话历史 (Conversation History)**: 自动管理会话上下文
- **工作记忆 (Working Memory)**: 短期上下文管理

### 3. 嵌入层 (Embedding Layer)
- **FastEmbed**: 本地嵌入模型，无需外部API调用
- **支持多语言**: 中英文混合内容处理

### 4. 代理层 (Agent Layer)
- **推荐代理**: 集成Mastra记忆功能的家电推荐助手
- **记忆处理器**: 自动过滤和处理记忆内容

## 架构优势

### 相比当前系统的改进
1. **简化复杂度**: 移除自定义记忆管理逻辑
2. **原生集成**: 与Mastra框架深度集成
3. **自动化**: 记忆的存储、检索、过期自动处理
4. **性能优化**: 利用PostgreSQL和pgvector的高性能
5. **可扩展性**: 支持大规模记忆数据

### 功能特性
- **自动记忆管理**: 无需手动管理记忆生命周期
- **智能检索**: 基于语义相似度的记忆召回
- **多线程支持**: 支持多用户、多会话
- **资源管理**: 自动清理过期记忆
- **类型安全**: 完整的TypeScript支持

## 实施计划

### 阶段1: 基础设施配置
1. 配置PostgreSQL + pgvector
2. 设置Mastra Memory实例
3. 配置FastEmbed嵌入器

### 阶段2: 代理重构
1. 重写推荐代理，集成Mastra Memory
2. 配置记忆选项和处理器
3. 实现线程和资源管理

### 阶段3: 迁移和清理
1. 迁移现有数据（如需要）
2. 移除旧的记忆系统代码
3. 更新相关工作流

### 阶段4: 测试和优化
1. 功能测试
2. 性能测试
3. 用户体验优化

## 配置示例

```typescript
// 记忆配置
const memory = new Memory({
  store: new PostgresStore({
    connectionString: process.env.DATABASE_URL,
  }),
  vector: new PgVector({
    connectionString: process.env.DATABASE_URL,
    dimensions: 384, // FastEmbed默认维度
  }),
  embedder: new FastEmbedEmbedder({
    model: 'BAAI/bge-small-zh-v1.5', // 支持中文
  }),
});

// 代理配置
const recommendationAgent = new Agent({
  name: 'recommendation-agent',
  instructions: '...',
  model: openai('ep-m-20251024161251-sjljb'),
  memory,
  memoryOptions: {
    lastMessages: 10,
    semanticRecall: {
      topK: 5,
      messageRange: 100,
    },
  },
});
```

## 数据模型

### 线程 (Threads)
- 用户会话管理
- 自动创建和维护

### 消息 (Messages)
- 对话历史记录
- 自动向量化和索引

### 向量 (Vectors)
- 语义嵌入存储
- 高效相似度检索

### 工作记忆 (Working Memory)
- 临时上下文存储
- 自动过期清理

## 迁移策略

### 数据迁移
- 保留重要的用户偏好数据
- 转换为Mastra兼容格式
- 渐进式迁移，确保服务连续性

### 代码迁移
- 逐步替换记忆相关组件
- 保持API兼容性
- 充分测试确保功能完整性