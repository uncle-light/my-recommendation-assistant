import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// 输入输出Schema定义
const ApplianceWorkflowInputSchema = z.object({
  userQuery: z.string().describe('用户的家电需求查询'),
  budget: z.number().optional().describe('预算范围'),
  category: z.string().optional().describe('家电类别')
});

const ApplianceWorkflowOutputSchema = z.object({
  recommendations: z.array(z.object({
    name: z.string(),
    brand: z.string(),
    price: z.number(),
    reason: z.string()
  })),
  summary: z.string()
});

export type ApplianceWorkflowInput = z.infer<typeof ApplianceWorkflowInputSchema>;
export type ApplianceWorkflowOutput = z.infer<typeof ApplianceWorkflowOutputSchema>;

// 步骤1: 分析用户需求
const analyzeUserNeedsStep = createStep({
  id: 'analyze_user_needs',
  inputSchema: ApplianceWorkflowInputSchema,
  outputSchema: z.object({
    analyzedQuery: z.string(),
    extractedCategory: z.string(),
    extractedBudget: z.number()
  }),
  execute: async ({ inputData }) => {
    const { userQuery, budget, category } = inputData;
    
    // 简单的需求分析逻辑
    const extractedCategory = category || '冰箱'; // 默认类别
    const extractedBudget = budget || 5000; // 默认预算
    
    return {
      analyzedQuery: userQuery,
      extractedCategory,
      extractedBudget
    };
  }
});

// 步骤2: 生成推荐
const generateRecommendationsStep = createStep({
  id: 'generate_recommendations',
  inputSchema: z.object({
    analyzedQuery: z.string(),
    extractedCategory: z.string(),
    extractedBudget: z.number()
  }),
  outputSchema: z.object({
    recommendations: z.array(z.object({
      name: z.string(),
      brand: z.string(),
      price: z.number(),
      reason: z.string()
    }))
  }),
  execute: async ({ inputData }) => {
    const { extractedCategory, extractedBudget } = inputData;
    
    // 模拟推荐逻辑
    const mockRecommendations = [
      {
        name: `${extractedCategory}推荐1`,
        brand: '海尔',
        price: Math.min(extractedBudget * 0.8, 4000),
        reason: '性价比高，节能环保'
      },
      {
        name: `${extractedCategory}推荐2`,
        brand: '美的',
        price: Math.min(extractedBudget * 0.9, 4500),
        reason: '品质可靠，功能齐全'
      }
    ];
    
    return {
      recommendations: mockRecommendations
    };
  }
});

// 步骤3: 生成总结
const generateSummaryStep = createStep({
  id: 'generate_summary',
  inputSchema: z.object({
    recommendations: z.array(z.object({
      name: z.string(),
      brand: z.string(),
      price: z.number(),
      reason: z.string()
    }))
  }),
  outputSchema: ApplianceWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    const { recommendations } = inputData;
    
    const summary = `为您推荐了${recommendations.length}款产品，价格范围在${Math.min(...recommendations.map(r => r.price))}到${Math.max(...recommendations.map(r => r.price))}元之间。`;
    
    return {
      recommendations,
      summary
    };
  }
});

// 创建工作流
export const applianceWorkflow = createWorkflow({
  id: 'appliance-recommendation-workflow',
  inputSchema: ApplianceWorkflowInputSchema,
  outputSchema: ApplianceWorkflowOutputSchema
})
  .then(analyzeUserNeedsStep)
  .then(generateRecommendationsStep)
  .then(generateSummaryStep);

// 提交工作流
applianceWorkflow.commit();

export { ApplianceWorkflowInputSchema, ApplianceWorkflowOutputSchema };