// 数据库Schema定义 - 适配Mastra原生记忆系统
import { z } from "zod";

/**
 * 用户Schema
 */
export const UserSchema = z.object({
  id: z.string().describe("用户ID"),
  name: z.string().optional().describe("用户姓名"),
  email: z.string().email().optional().describe("用户邮箱"),
  preferences: z.object({
    brands: z.array(z.string()).optional().describe("偏好品牌"),
    categories: z.array(z.string()).optional().describe("偏好类别"),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional().describe("价格范围偏好"),
    features: z.array(z.string()).optional().describe("偏好功能"),
  }).optional().describe("用户偏好"),
  createdAt: z.string().datetime().optional().describe("创建时间"),
  updatedAt: z.string().datetime().optional().describe("更新时间"),
});

/**
 * 产品Schema
 */
export const ProductSchema = z.object({
  id: z.string().describe("产品ID"),
  name: z.string().describe("产品名称"),
  description: z.string().optional().describe("产品描述"),
  category: z.string().describe("产品类别"),
  brand: z.string().optional().describe("品牌"),
  price: z.number().min(0).describe("价格"),
  originalPrice: z.number().min(0).optional().describe("原价"),
  currency: z.string().default("CNY").describe("货币单位"),
  images: z.array(z.string()).optional().describe("产品图片URL"),
  features: z.array(z.string()).optional().describe("产品特性"),
  specifications: z.record(z.string(), z.any()).optional().describe("产品规格"),
  rating: z.number().min(0).max(5).optional().describe("评分"),
  reviewCount: z.number().min(0).optional().describe("评论数量"),
  availability: z.boolean().default(true).describe("是否有货"),
  tags: z.array(z.string()).optional().describe("产品标签"),
  createdAt: z.string().datetime().optional().describe("创建时间"),
  updatedAt: z.string().datetime().optional().describe("更新时间"),
});

/**
 * 用户行为Schema
 */
export const UserActionSchema = z.object({
  id: z.string().describe("行为ID"),
  userId: z.string().describe("用户ID"),
  action: z.enum(["view", "click", "purchase", "favorite", "compare", "search"]).describe("行为类型"),
  productId: z.string().optional().describe("产品ID"),
  query: z.string().optional().describe("搜索查询"),
  metadata: z.record(z.string(), z.any()).optional().describe("额外元数据"),
  timestamp: z.string().datetime().describe("行为时间"),
  sessionId: z.string().optional().describe("会话ID"),
});

/**
 * 推荐记录Schema
 */
export const RecommendationSchema = z.object({
  id: z.string().describe("推荐ID"),
  userId: z.string().describe("用户ID"),
  productIds: z.array(z.string()).describe("推荐产品ID列表"),
  algorithm: z.string().describe("推荐算法"),
  confidence: z.number().min(0).max(1).describe("推荐置信度"),
  context: z.record(z.string(), z.any()).optional().describe("推荐上下文"),
  feedback: z.object({
    clicked: z.boolean().optional(),
    purchased: z.boolean().optional(),
    rating: z.number().min(0).max(5).optional(),
  }).optional().describe("用户反馈"),
  createdAt: z.string().datetime().describe("创建时间"),
});

// 类型导出
export type User = z.infer<typeof UserSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type UserAction = z.infer<typeof UserActionSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;

// Schema集合
export const Schemas = {
  User: UserSchema,
  Product: ProductSchema,
  UserAction: UserActionSchema,
  Recommendation: RecommendationSchema,
} as const;

export const schemas = {
  user: UserSchema,
  product: ProductSchema,
  userAction: UserActionSchema,
  recommendation: RecommendationSchema,
};

// 数据库表配置
export const DatabaseTables = {
  users: 'users',
  products: 'products',
  user_actions: 'user_actions',
  recommendations: 'recommendations',
};

// 数据库索引配置
export const DatabaseIndexes = {
  users: ['id', 'email'],
  products: ['id', 'category', 'brand'],
  user_actions: ['user_id', 'product_id', 'action_type', 'timestamp'],
  recommendations: ['user_id', 'product_id', 'score'],
};

export default Schemas;