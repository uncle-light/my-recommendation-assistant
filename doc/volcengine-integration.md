# 火山引擎 VolcEngine 集成指南

## 概述

本项目已成功集成火山引擎ARK平台的AI服务，支持使用豆包嵌入模型进行语义搜索和记忆存储。

## 🚀 功能特性

- ✅ **自定义AI SDK提供商**：基于AI SDK v2规范实现的火山引擎提供商
- ✅ **嵌入模型支持**：支持多种豆包嵌入模型
- ✅ **智能回退机制**：优先使用火山引擎，自动回退到OpenAI
- ✅ **Memory集成**：完全集成到Mastra Memory系统
- ✅ **环境配置**：灵活的环境变量配置

## 📋 支持的模型

### 嵌入模型
- `doubao-embedding-large` - 大型嵌入模型
- `doubao-embedding-large-text-250515` - 大型文本嵌入模型（2025年5月版）
- `doubao-embedding-large-text-240915` - 大型文本嵌入模型（2024年9月版）
- `doubao-embedding` - 标准嵌入模型
- `doubao-embedding-text-240715` - 文本嵌入模型（默认使用）

## ⚙️ 配置步骤

### 1. 环境变量配置

在 `.env` 文件中添加以下配置：

```bash
# 火山引擎 ARK API 配置
VOLCENGINE_API_KEY=your_volcengine_api_key_here
ARK_API_KEY=your_volcengine_api_key_here  # 备用配置
VOLCENGINE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VOLCENGINE_REGION=cn-beijing

# OpenAI配置（作为回退选项）
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. 获取API Key

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 开通ARK大模型服务
3. 创建API Key
4. 将API Key填入环境变量

### 3. 验证配置

运行集成测试：

```bash
# 设置环境变量
export VOLCENGINE_API_KEY="your_actual_api_key"

# 运行测试
npx tsx src/test/volcengine-test.ts
```

## 🔧 使用方式

### 直接使用提供商

```typescript
import { volcengine, volcengineEmbeddingModels } from '../lib/volcengine-provider';

// 创建嵌入模型实例
const embedder = volcengine.textEmbeddingModel(
  volcengineEmbeddingModels['doubao-embedding-text-240715']
);

// 生成嵌入向量
const result = await embedder.doEmbed({
  values: ['文本1', '文本2', '文本3'],
});

console.log('嵌入向量:', result.embeddings);
console.log('Token使用量:', result.usage.tokens);
```

### 通过Memory系统使用

```typescript
import { memory } from '../mastra/memory';

// Memory系统会自动使用火山引擎（如果配置了API Key）
const threadId = await memory.createThread({
  resourceId: 'user-session-123',
});

await memory.addMessages({
  threadId,
  messages: [
    { role: 'user', content: '你好，我想了解推荐系统' },
    { role: 'assistant', content: '我可以帮你了解推荐系统的相关知识...' },
  ],
});

// 语义搜索
const results = await memory.query({
  threadId,
  query: '推荐算法',
  topK: 5,
});
```

## 🔄 智能回退机制

系统会按以下优先级选择嵌入模型：

1. **火山引擎优先**：如果设置了 `VOLCENGINE_API_KEY` 或 `ARK_API_KEY`
2. **OpenAI回退**：如果火山引擎不可用，自动使用OpenAI

```typescript
// 自动选择逻辑
const getEmbedder = () => {
  if (process.env.VOLCENGINE_API_KEY || process.env.ARK_API_KEY) {
    return volcengine.textEmbeddingModel(volcengineEmbeddingModels['doubao-embedding-text-240715']);
  }
  return "openai/ep-20251016153453-g2d58";
};
```

## 📁 文件结构

```
src/
├── lib/
│   └── volcengine-provider.ts     # 火山引擎自定义提供商
├── mastra/
│   ├── memory/
│   │   └── index.ts              # Memory配置（已集成火山引擎）
│   └── agents/
│       └── weather-agent.ts      # Agent配置（已集成火山引擎）
├── test/
│   └── volcengine-test.ts        # 集成测试文件
└── ...
```

## 🐛 故障排除

### 常见错误及解决方案

#### 1. API Key错误
```
Error: Volcengine API error: 401 Unauthorized
```
**解决方案**：检查API Key是否正确设置

#### 2. 模型不存在
```
Error: Volcengine API error: 404 Not Found
```
**解决方案**：确认使用的模型名称是否正确

#### 3. 网络连接问题
```
Error: fetch failed
```
**解决方案**：检查网络连接和API端点配置

### 调试技巧

1. **启用详细日志**：
```bash
export DEBUG=volcengine:*
```

2. **测试API连接**：
```bash
curl -X POST "https://ark.cn-beijing.volces.com/api/v3/embeddings" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "doubao-embedding-text-240715", "input": ["测试文本"]}'
```

## 📊 性能优化

### 批量处理
```typescript
// 推荐：批量处理多个文本
const texts = ['文本1', '文本2', '文本3', ...];
const result = await embedder.doEmbed({ values: texts });

// 避免：逐个处理
// for (const text of texts) {
//   await embedder.doEmbed({ values: [text] });
// }
```

### 缓存策略
```typescript
// 可以考虑添加嵌入向量缓存
const cache = new Map();
const getCachedEmbedding = async (text: string) => {
  if (cache.has(text)) {
    return cache.get(text);
  }
  const result = await embedder.doEmbed({ values: [text] });
  cache.set(text, result.embeddings[0]);
  return result.embeddings[0];
};
```

## 🔮 未来扩展

- [ ] 支持火山引擎的聊天模型
- [ ] 支持图像模型
- [ ] 添加更多配置选项
- [ ] 性能监控和指标收集

## 📞 技术支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 运行集成测试验证配置
3. 检查火山引擎官方文档
4. 提交Issue到项目仓库

---

**注意**：请确保妥善保管API Key，不要将其提交到版本控制系统中。