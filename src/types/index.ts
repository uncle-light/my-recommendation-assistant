import { z } from 'zod';

// 用户相关类型
export const UserSchema = z.object({
  userId: z.string(),
  registrationDate: z.date(),
  membershipLevel: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  staticAttributes: z.record(z.string(), z.any()).optional(),
});

export type User = z.infer<typeof UserSchema>;

// 商品相关类型
export const ProductSchema = z.object({
  itemId: z.string(),
  title: z.string(),
  description: z.string(),
  brand: z.string(),
  category: z.string(),
  price: z.number(),
  inStock: z.boolean(),
  tags: z.array(z.string()).optional(),
  embedding: z.array(z.number()).optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// 用户偏好类型
export const UserPreferenceSchema = z.object({
  userId: z.string(),
  categoryCounts: z.record(z.string(), z.number()),
  brandCounts: z.record(z.string(), z.number()),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
  updatedAt: z.date(),
});

export type UserPreference = z.infer<typeof UserPreferenceSchema>;

// 用户行为日志类型
export const UserActionLogSchema = z.object({
  logId: z.string(),
  userId: z.string(),
  actionType: z.enum(['browse', 'click', 'purchase', 'add_to_cart', 'like', 'dislike']),
  itemId: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type UserActionLog = z.infer<typeof UserActionLogSchema>;

// 推荐反馈类型
export const RecommendationFeedbackSchema = z.object({
  feedbackId: z.string(),
  userId: z.string(),
  itemId: z.string(),
  recommendationId: z.string(),
  clicked: z.boolean(),
  purchased: z.boolean(),
  timestamp: z.date(),
  rating: z.number().min(1).max(5).optional(),
});

export type RecommendationFeedback = z.infer<typeof RecommendationFeedbackSchema>;

// 记忆相关类型
export const MemoryItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['preference', 'interaction', 'feedback', 'session']),
  content: z.string(),
  embedding: z.array(z.number()),
  metadata: z.record(z.string(), z.any()),
  timestamp: z.date(),
  tags: z.array(z.string()).optional(),
});

export type MemoryItem = z.infer<typeof MemoryItemSchema>;

// 推荐请求类型
export const RecommendationRequestSchema = z.object({
  userId: z.string(),
  intent: z.string().optional(),
  filterParams: z.object({
    category: z.string().optional(),
    brand: z.string().optional(),
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    inStock: z.boolean().optional(),
  }).optional(),
  limit: z.number().default(10),
});

export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;

// 推荐结果类型
export const RecommendationResultSchema = z.object({
  recommendationId: z.string(),
  userId: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    score: z.number(),
    reason: z.string(),
  })),
  timestamp: z.date(),
  algorithm: z.string(),
});

export type RecommendationResult = z.infer<typeof RecommendationResultSchema>;

// 会话上下文类型
export const SessionContextSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.date(),
  })),
  currentIntent: z.string().optional(),
  memoryContext: z.array(MemoryItemSchema).optional(),
});

export type SessionContext = z.infer<typeof SessionContextSchema>;

// Agent 输入输出类型
export const AgentInputSchema = z.object({
  userId: z.string(),
  message: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
});

export type AgentInput = z.infer<typeof AgentInputSchema>;

export const AgentOutputSchema = z.object({
  response: z.string(),
  recommendations: z.array(z.string()).optional(),
  intent: z.string().optional(),
  confidence: z.number().optional(),
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;