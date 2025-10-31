# 动态模型选择机制

## 概述

本项目实现了智能的动态模型选择机制，支持火山引擎和OpenAI之间的自动回退，确保系统的高可用性和灵活性。

## 核心功能

### 1. 智能回退机制

系统会根据API密钥的可用性自动选择最佳的模型提供商：

- **优先级**: 火山引擎 > OpenAI
- **自动检测**: 检查环境变量中的API密钥配置
- **智能回退**: 当主要提供商不可用时，自动切换到备用提供商

### 2. 环境变量配置

```bash
# 火山引擎配置（优先使用）
VOLCENGINE_API_KEY=your_volcengine_api_key

# OpenAI配置（回退选项）
OPENAI_API_KEY=your_openai_api_key
```

### 3. 使用方式

#### 基本用法

```typescript
import { getDynamicModel } from '../lib/model-config';

// 获取动态选择的模型
const model = getDynamicModel();

// 在Agent中使用
const agent = new Agent({
  name: 'my-agent',
  model: getDynamicModel(),
  // ... 其他配置
});
```

#### 获取模型信息

```typescript
import { getModelInfo } from '../lib/model-config';

const info = getModelInfo();
console.log('主要模型:', info.primary);
console.log('回退模型:', info.fallback);
console.log('可用性:', info.available);
```

#### 使用预定义配置

```typescript
import { createModelFromConfig } from '../lib/model-config';

// 使用特定配置创建模型
const model = createModelFromConfig('volcengine-lite');
```

## 预定义模型配置

| 配置名称            | 提供商   | 模型                                    | 温度 | 最大Token |
| ------------------- | -------- | --------------------------------------- | ---- | --------- |
| `volcengine-lite`   | 火山引擎 | ep-20241230140359-8xqzr                 | 0.7  | 4000      |
| `volcengine-pro`    | 火山引擎 | ep-20241230140359-8xqzr                 | 0.7  | 8000      |
| `openai-gpt4`       | OpenAI   | ep-m-20251024161251-sjljb               | 0.7  | 4000      |
| `openai-gpt4-turbo` | OpenAI   | ep-m-20251024161251-sjljb-turbo-preview | 0.7  | 8000      |

## 错误处理

当没有可用的API密钥时，系统会抛出明确的错误信息：

```
Error: No valid API keys found. Please configure either VOLCENGINE_API_KEY or OPENAI_API_KEY environment variable.
```

## 测试

运行动态模型选择测试：

```bash
npx tsx src/test/dynamic-model-test.ts
```

测试将验证：
- 模型信息获取
- 动态模型选择
- 预定义配置
- 环境变量检查

## 架构优势

1. **高可用性**: 自动回退机制确保服务连续性
2. **灵活性**: 支持多种模型提供商和配置
3. **易用性**: 统一的API接口，无需关心底层实现
4. **可扩展性**: 易于添加新的模型提供商和配置

## 迁移指南

### 从固定模型迁移

**之前**:
```typescript
import { openai } from '@ai-sdk/openai';

const agent = new Agent({
  model: openai('ep-m-20251024161251-sjljb'),
  // ...
});
```

**之后**:
```typescript
import { getDynamicModel } from '../lib/model-config';

const agent = new Agent({
  model: getDynamicModel(),
  // ...
});
```

### 批量更新

项目中的所有Agent已经更新为使用动态模型选择：
- `recommendation-agent.ts`
- `memory-agent.ts`
- `shopping-assistant.ts`

## 注意事项

1. **API密钥安全**: 确保API密钥安全存储，不要提交到版本控制系统
2. **成本控制**: 不同提供商的定价可能不同，请注意成本控制
3. **模型差异**: 不同模型的能力和响应格式可能略有差异
4. **监控**: 建议监控模型使用情况和性能指标

## 故障排除

### 常见问题

1. **模型创建失败**
   - 检查API密钥是否正确配置
   - 验证网络连接
   - 确认API密钥权限

2. **回退不生效**
   - 确保至少配置了一个有效的API密钥
   - 检查环境变量名称是否正确

3. **性能问题**
   - 考虑使用更快的模型配置
   - 调整温度和最大Token参数