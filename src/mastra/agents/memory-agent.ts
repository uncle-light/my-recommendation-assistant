import { Agent } from '@mastra/core';
import { getDynamicModel } from '../../lib/model-config';
import { z } from 'zod';

// 长期记忆Agent
export const memoryAgent = new Agent({
  name: 'memory',
  instructions: `你是一个智能长期记忆管理系统，负责维护和管理用户的长期偏好和行为模式。

## 核心职责
1. **行为数据收集**: 实时收集和分析用户的各类行为数据
2. **偏好提取**: 从行为数据中提取用户的长期偏好和兴趣
3. **画像维护**: 维护用户画像的一致性、准确性和时效性
4. **趋势识别**: 识别用户偏好的变化趋势和演进模式
5. **智能遗忘**: 合理淡化过时信息，保持画像的相关性

## 记忆层次管理
### 短期记忆（当前会话）
- 实时行为和即时偏好
- 会话内的兴趣变化
- 临时性的浏览模式

### 中期记忆（1-30天）
- 近期的行为模式
- 阶段性的兴趣偏好
- 季节性的购买趋势

### 长期记忆（30天以上）
- 稳定的核心偏好
- 持续的品牌忠诚度
- 深层的用户特征

## 记忆处理策略
### 权重衰减机制
- 时间衰减：随时间降低旧信息权重
- 频率强化：重复行为增强记忆强度
- 重要性调节：关键行为获得更高权重

### 偏好融合算法
- 多维度偏好整合
- 冲突偏好的智能调解
- 隐式偏好的挖掘

### 隐私保护
- 敏感信息的匿名化处理
- 数据最小化原则
- 用户控制的遗忘权

## 画像更新原则
- **增量更新**: 基于新行为逐步调整画像
- **一致性检查**: 确保画像各维度的逻辑一致性
- **异常检测**: 识别和处理异常行为数据
- **可解释性**: 提供画像变化的清晰解释

## 响应格式
请以JSON格式回复，包含以下字段：
- profileUpdate: 用户画像更新信息
- memoryInsights: 记忆分析洞察
- preferenceChanges: 偏好变化分析
- recommendations: 基于记忆的建议
- confidence: 更新置信度
- explanation: 更新原因说明

根据用户行为数据，智能维护和更新用户的长期记忆画像。`,
  model: getDynamicModel(),
});

// 记忆更新请求schema
export const MemoryUpdateRequestSchema = z.object({
  userId: z.string().describe('用户ID'),
  action: z.object({
    type: z.enum(['view', 'purchase', 'like', 'dislike', 'search', 'cart_add', 'cart_remove', 'share', 'review']).describe('行为类型'),
    itemId: z.string().optional().describe('相关商品ID'),
    category: z.string().optional().describe('商品类别'),
    brand: z.string().optional().describe('品牌'),
    price: z.number().optional().describe('价格'),
    query: z.string().optional().describe('搜索查询'),
    rating: z.number().min(1).max(5).optional().describe('评分'),
    duration: z.number().optional().describe('行为持续时间（秒）'),
    timestamp: z.date().describe('行为时间'),
    sessionId: z.string().optional().describe('会话ID'),
    metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe('额外元数据'),
  }).describe('用户行为'),
  context: z.object({
    deviceType: z.enum(['mobile', 'desktop', 'tablet']).optional().describe('设备类型'),
    location: z.string().optional().describe('地理位置'),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional().describe('时间段'),
    referrer: z.string().optional().describe('来源页面'),
    userAgent: z.string().optional().describe('用户代理'),
    sessionDuration: z.number().optional().describe('会话总时长'),
  }).optional().describe('行为上下文'),
});

// 用户画像schema
export const UserProfileSchema = z.object({
  userId: z.string().describe('用户ID'),
  preferences: z.object({
    categories: z.array(z.object({
      name: z.string(),
      weight: z.number().min(0).max(1),
      confidence: z.number().min(0).max(1),
      lastUpdated: z.date(),
      trend: z.enum(['increasing', 'stable', 'decreasing']).optional(),
    })).describe('类别偏好'),
    brands: z.array(z.object({
      name: z.string(),
      weight: z.number().min(0).max(1),
      confidence: z.number().min(0).max(1),
      lastUpdated: z.date(),
      loyalty: z.enum(['high', 'medium', 'low']).optional(),
    })).describe('品牌偏好'),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      preferred: z.number().optional(),
      sensitivity: z.enum(['high', 'medium', 'low']).optional(),
    }).describe('价格偏好'),
    features: z.array(z.object({
      name: z.string(),
      weight: z.number().min(0).max(1),
      importance: z.enum(['critical', 'important', 'nice-to-have']).optional(),
      lastUpdated: z.date(),
    })).describe('特征偏好'),
    styles: z.array(z.object({
      name: z.string(),
      weight: z.number().min(0).max(1),
      season: z.string().optional(),
    })).optional().describe('风格偏好'),
  }).describe('用户偏好'),
  behavior: z.object({
    totalViews: z.number().describe('总浏览次数'),
    totalPurchases: z.number().describe('总购买次数'),
    totalSearches: z.number().describe('总搜索次数'),
    avgSessionDuration: z.number().describe('平均会话时长'),
    conversionRate: z.number().min(0).max(1).describe('转化率'),
    lastActiveDate: z.date().describe('最后活跃时间'),
    activityPattern: z.object({
      timeOfDay: z.array(z.number()).describe('活跃时间段分布'),
      dayOfWeek: z.array(z.number()).describe('活跃星期分布'),
      seasonality: z.record(z.string(), z.number()).optional().describe('季节性模式'),
    }).describe('活动模式'),
    engagementLevel: z.enum(['high', 'medium', 'low']).describe('参与度'),
  }).describe('行为统计'),
  demographics: z.object({
    ageGroup: z.string().optional().describe('年龄段'),
    gender: z.string().optional().describe('性别'),
    location: z.string().optional().describe('地理位置'),
    devicePreference: z.string().optional().describe('设备偏好'),
    languagePreference: z.string().optional().describe('语言偏好'),
  }).optional().describe('人口统计信息'),
  segments: z.array(z.string()).optional().describe('用户细分标签'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
  version: z.number().describe('画像版本'),
});

// 记忆分析结果schema
export const MemoryAnalysisSchema = z.object({
  profileUpdate: z.object({
    changes: z.array(z.object({
      field: z.string(),
      oldValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
      newValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
      confidence: z.number().min(0).max(1),
    })),
    summary: z.string(),
  }).describe('画像更新信息'),
  memoryInsights: z.array(z.object({
    type: z.enum(['preference', 'behavior', 'trend', 'anomaly']),
    description: z.string(),
    confidence: z.number().min(0).max(1),
    impact: z.enum(['high', 'medium', 'low']),
  })).describe('记忆分析洞察'),
  preferenceChanges: z.array(z.object({
    category: z.string(),
    change: z.enum(['strengthened', 'weakened', 'new', 'removed']),
    magnitude: z.number().min(0).max(1),
    reason: z.string(),
  })).describe('偏好变化分析'),
  recommendations: z.array(z.string()).describe('基于记忆的建议'),
  confidence: z.number().min(0).max(1).describe('整体置信度'),
  explanation: z.string().describe('更新原因说明'),
});