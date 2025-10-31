// {{RIPER-5:
//   Action: "Added"
//   Task_ID: "implement-memory-agents"
//   Timestamp: "2025-01-27T10:45:00Z"
//   Authoring_Role: "LD"
//   Principle_Applied: "SOLID-S (单一职责原则)"
//   Quality_Check: "使用Mastra原生记忆系统重新实现推荐代理"
// }}
// {{START_MODIFICATIONS}}

import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { memory } from "../memory";
import { productTools, currentTimeTool } from "../tools";

// 配置火山引擎模型
const volcengine = createOpenAI({
  apiKey: process.env.VOLCENGINE_API_KEY || '',
  baseURL: process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
});

/**
 * 推荐代理输入Schema
 */
export const RecommendationAgentInputSchema = z.object({
  query: z.string().describe("用户的查询或需求"),
  userId: z.string().describe("用户ID"),
  context: z
    .object({
      budget: z.number().optional().describe("预算范围"),
      category: z.string().optional().describe("产品类别"),
      preferences: z.array(z.string()).optional().describe("用户偏好"),
    })
    .optional()
    .describe("查询上下文"),
});

/**
 * 推荐代理输出Schema
 */
export const RecommendationAgentOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        productId: z.string().describe("产品ID"),
        name: z.string().describe("产品名称"),
        reason: z.string().describe("推荐理由"),
        confidence: z.number().min(0).max(1).describe("推荐置信度"),
      })
    )
    .describe("推荐产品列表"),
  explanation: z.string().describe("推荐解释"),
  followUpQuestions: z.array(z.string()).optional().describe("后续问题建议"),
});

export type RecommendationAgentInput = z.infer<
  typeof RecommendationAgentInputSchema
>;
export type RecommendationAgentOutput = z.infer<
  typeof RecommendationAgentOutputSchema
>;

/**
 * 智能推荐代理
 * 集成Mastra记忆系统，提供个性化家电推荐
 */
export const recommendationAgent = new Agent({
  name: "recommendation-agent",
  instructions: `你是一个专业的家电推荐助手，具有以下能力：

## 核心职责
1. **理解用户需求**: 分析用户的查询，识别具体的家电需求
2. **记忆管理**: 自动记住用户的偏好、购买历史和交互记录
3. **个性化推荐**: 基于用户历史和偏好提供精准推荐
4. **解释推荐**: 清晰说明推荐理由和产品优势

## 记忆能力
- **自动记忆**: 用户偏好、预算范围、品牌倾向、功能需求
- **上下文理解**: 结合历史对话提供连贯的服务体验
- **学习适应**: 根据用户反馈调整推荐策略

## 推荐原则
1. **需求匹配**: 确保推荐产品符合用户实际需求
2. **性价比**: 在预算范围内推荐最优选择
3. **品质保证**: 优先推荐可靠品牌和高评分产品
4. **功能实用**: 关注产品的实际使用价值

## 交互风格
- 友好专业，耐心细致
- 主动询问关键信息（预算、空间、使用场景等）
- 提供清晰的产品对比和选择建议
- 适时提出后续问题，深入了解需求

## 输出格式
始终使用结构化格式输出推荐结果，包括：
- 推荐产品列表（产品ID、名称、推荐理由、置信度）
- 详细解释
- 后续问题建议（可选）

记住：你的目标是成为用户最信赖的家电购买顾问，通过记忆和学习不断提升服务质量。`,

  model: volcengine("ep-m-20251024161251-sjljb"),
  memory,
  tools: {
    ...productTools,
    currentTime: currentTimeTool,
  },
});

/**
 * 推荐代理工具函数
 * 提供便捷的代理调用接口
 */
export async function getRecommendations(
  input: RecommendationAgentInput,
  options?: {
    threadId?: string;
  }
) {
  const { userId, query, context } = input;

  // 构建记忆配置
  const memoryConfig = {
    thread: options?.threadId || `user-${userId}-recommendations`,
    resource: `user:${userId}`,
  };

  // 构建提示消息
  const prompt = `用户查询: ${query}
${
  context
    ? `
查询上下文:
- 预算: ${context.budget ? `${context.budget}元` : "未指定"}
- 类别: ${context.category || "未指定"}
- 偏好: ${context.preferences?.join(", ") || "未指定"}
`
    : ""
}

请基于用户的历史记忆和当前需求，提供个性化的家电推荐。

请以JSON格式返回推荐结果，包含以下字段：
- recommendations: 推荐产品列表，每个产品包含productId、name、reason、confidence
- explanation: 推荐解释
- followUpQuestions: 后续问题建议（可选）`;

  try {
    const result = await recommendationAgent.generate(prompt, {
      memory: memoryConfig,
      structuredOutput: {
        schema: RecommendationAgentOutputSchema,
      },
    });

    return {
      success: true,
      data: result.object as RecommendationAgentOutput,
      threadId: memoryConfig.thread,
    };
  } catch (error) {
    console.error("推荐代理执行失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      threadId: memoryConfig.thread,
    };
  }
}

// {{END_MODIFICATIONS}}
