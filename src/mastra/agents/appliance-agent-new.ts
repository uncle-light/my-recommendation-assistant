// {{RIPER-5:
//   Action: "Added"
//   Task_ID: "implement-memory-agents"
//   Timestamp: "2025-01-27T10:50:00Z"
//   Authoring_Role: "LD"
//   Principle_Applied: "SOLID-S (单一职责原则)"
//   Quality_Check: "使用Mastra原生记忆系统重新实现家电代理"
// }}
// {{START_MODIFICATIONS}}

import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { memory } from "../memory";

// 配置火山引擎模型
const volcengine = createOpenAI({
  apiKey: process.env.VOLCENGINE_API_KEY || "",
  baseURL:
    process.env.VOLCENGINE_BASE_URL ||
    "https://ark.cn-beijing.volces.com/api/v3",
});

/**
 * 家电代理输入Schema
 */
export const ApplianceAgentInputSchema = z.object({
  query: z.string().describe("用户的查询或需求"),
  userId: z.string().describe("用户ID"),
  action: z
    .enum(["search", "compare", "recommend", "chat"])
    .describe("操作类型"),
  context: z
    .object({
      products: z
        .array(z.string())
        .optional()
        .describe("产品ID列表（用于比较）"),
      category: z.string().optional().describe("产品类别"),
      budget: z.number().optional().describe("预算范围"),
      features: z.array(z.string()).optional().describe("关注的功能特性"),
    })
    .optional()
    .describe("操作上下文"),
});

/**
 * 家电代理输出Schema
 */
export const ApplianceAgentOutputSchema = z.object({
  response: z.string().describe("回复内容"),
  products: z
    .array(
      z.object({
        id: z.string().describe("产品ID"),
        name: z.string().describe("产品名称"),
        category: z.string().describe("产品类别"),
        price: z.number().describe("价格"),
        features: z.array(z.string()).describe("主要功能"),
        rating: z.number().min(0).max(5).describe("评分"),
        summary: z.string().describe("产品摘要"),
      })
    )
    .optional()
    .describe("相关产品列表"),
  suggestions: z.array(z.string()).optional().describe("建议或后续问题"),
  userPreferences: z
    .object({
      brands: z.array(z.string()).optional().describe("偏好品牌"),
      priceRange: z
        .object({
          min: z.number(),
          max: z.number(),
        })
        .optional()
        .describe("价格范围偏好"),
      features: z.array(z.string()).optional().describe("偏好功能"),
    })
    .optional()
    .describe("更新的用户偏好"),
});

export type ApplianceAgentInput = z.infer<typeof ApplianceAgentInputSchema>;
export type ApplianceAgentOutput = z.infer<typeof ApplianceAgentOutputSchema>;

/**
 * 智能家电助手代理
 * 集成Mastra记忆系统，提供全面的家电咨询服务
 */
export const applianceAgent = new Agent({
  name: "appliance-agent",
  instructions: `你是一个专业的家电购买助手，具有丰富的家电知识和记忆能力。

## 核心能力
1. **产品搜索**: 根据用户需求搜索合适的家电产品
2. **产品比较**: 对比不同产品的优缺点和性价比
3. **个性化推荐**: 基于用户历史偏好提供精准推荐
4. **智能对话**: 回答家电相关问题，提供购买建议

## 记忆管理
- **用户偏好**: 自动记住用户的品牌偏好、价格范围、功能需求
- **购买历史**: 记录用户的购买决策和反馈
- **对话上下文**: 维护连贯的对话体验
- **学习适应**: 根据用户反馈不断优化推荐策略

## 产品知识库
涵盖以下家电类别：
- **厨房电器**: 冰箱、洗碗机、微波炉、烤箱、电饭煲、豆浆机等
- **清洁电器**: 洗衣机、干衣机、吸尘器、扫地机器人等
- **空调制冷**: 空调、空气净化器、加湿器、除湿器等
- **小家电**: 电热水壶、咖啡机、榨汁机、电吹风等

## 服务原则
1. **需求理解**: 深入了解用户的实际需求和使用场景
2. **专业建议**: 提供基于产品特性和用户需求的专业建议
3. **性价比导向**: 在预算范围内推荐最优选择
4. **诚实透明**: 客观评价产品优缺点，不夸大宣传

## 交互风格
- 友好专业，耐心细致
- 主动询问关键信息（使用场景、预算、空间限制等）
- 提供清晰的产品对比和选择理由
- 适时总结用户偏好，优化后续服务

## 输出要求
根据用户的操作类型（search/compare/recommend/chat）提供相应的结构化输出：
- response: 主要回复内容
- products: 相关产品信息（如适用）
- suggestions: 后续建议或问题
- userPreferences: 识别或更新的用户偏好

记住：你的目标是成为用户最信赖的家电购买顾问，通过记忆和学习提供越来越精准的服务。`,

  model: volcengine("ep-20250818100830-hsrg8"),
  memory,
  tools: {},
});

/**
 * 家电代理工具函数
 * 提供便捷的代理调用接口
 */
export async function queryApplianceAgent(
  input: ApplianceAgentInput,
  options?: {
    threadId?: string;
  }
) {
  const { userId, query, action, context } = input;

  // 构建记忆配置
  const memoryConfig = {
    thread: options?.threadId || `user-${userId}-appliances`,
    resource: `user:${userId}`,
  };

  // 构建提示消息
  const prompt = `操作类型: ${action}
用户查询: ${query}
${
  context
    ? `
上下文信息:
- 产品列表: ${context.products?.join(", ") || "无"}
- 类别: ${context.category || "未指定"}
- 预算: ${context.budget ? `${context.budget}元` : "未指定"}
- 关注功能: ${context.features?.join(", ") || "未指定"}
`
    : ""
}

请基于用户的历史记忆和当前需求，提供专业的家电咨询服务。

请以JSON格式返回结果，包含以下字段：
- response: 主要回复内容
- products: 相关产品信息（如适用）
- suggestions: 后续建议或问题
- userPreferences: 识别或更新的用户偏好`;

  try {
    const result = await applianceAgent.generate(prompt, {
      memory: memoryConfig,
      structuredOutput: {
        schema: ApplianceAgentOutputSchema,
      },
    });

    return {
      success: true,
      data: result.object as ApplianceAgentOutput,
      threadId: memoryConfig.thread,
    };
  } catch (error) {
    console.error("家电代理执行失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      threadId: memoryConfig.thread,
    };
  }
}

/**
 * 便捷的家电搜索函数
 */
export async function searchAppliances(
  userId: string,
  query: string,
  options?: {
    category?: string;
    budget?: number;
    features?: string[];
    threadId?: string;
  }
) {
  return queryApplianceAgent(
    {
      userId,
      query,
      action: "search",
      context: {
        category: options?.category,
        budget: options?.budget,
        features: options?.features,
      },
    },
    {
      threadId: options?.threadId,
    }
  );
}

/**
 * 便捷的家电比较函数
 */
export async function compareAppliances(
  userId: string,
  productIds: string[],
  query?: string,
  options?: {
    threadId?: string;
  }
) {
  return queryApplianceAgent(
    {
      userId,
      query: query || `请比较这些产品: ${productIds.join(", ")}`,
      action: "compare",
      context: {
        products: productIds,
      },
    },
    {
      threadId: options?.threadId,
    }
  );
}

/**
 * 便捷的家电推荐函数
 */
export async function recommendAppliances(
  userId: string,
  query: string,
  options?: {
    category?: string;
    budget?: number;
    threadId?: string;
  }
) {
  return queryApplianceAgent(
    {
      userId,
      query,
      action: "recommend",
      context: {
        category: options?.category,
        budget: options?.budget,
      },
    },
    {
      threadId: options?.threadId,
    }
  );
}

// {{END_MODIFICATIONS}}
