import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { recommendationAgent } from '../agents/recommendation-agent';

// 推荐工作流输入schema
const RecommendationWorkflowInputSchema = z.object({
  userId: z.string().describe('用户ID'),
  requestType: z.enum(['similar', 'personalized', 'trending', 'category']).describe('推荐类型'),
  context: z.object({
    itemId: z.string().optional().describe('参考商品ID（用于相似推荐）'),
    category: z.string().optional().describe('商品类别'),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional().describe('价格范围'),
    userPreferences: z.record(z.string(), z.any()).optional().describe('用户偏好'),
    excludeItems: z.array(z.string()).optional().describe('排除的商品ID'),
  }).describe('推荐上下文'),
  limit: z.number().default(10).describe('推荐数量限制'),
});

// 推荐工作流输出schema
const RecommendationWorkflowOutputSchema = z.object({
  recommendations: z.array(z.object({
    itemId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    price: z.number(),
    category: z.string(),
    score: z.number().describe('推荐分数'),
    reason: z.string().describe('推荐理由'),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().optional(),
  })).describe('推荐结果'),
  metadata: z.object({
    totalCount: z.number(),
    algorithm: z.string(),
    timestamp: z.string(),
    requestType: z.string(),
  }).describe('推荐元数据'),
});

// 步骤1: 获取用户画像
const getUserProfileStep = createStep({
  id: 'getUserProfile',
  inputSchema: RecommendationWorkflowInputSchema,
  outputSchema: z.object({
    userId: z.string(),
    requestType: z.enum(['similar', 'personalized', 'trending', 'category']),
    context: z.object({
      itemId: z.string().optional(),
      category: z.string().optional(),
      priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
      userPreferences: z.record(z.string(), z.any()).optional(),
      excludeItems: z.array(z.string()).optional(),
    }),
    limit: z.number(),
    userProfile: z.object({
      preferences: z.record(z.string(), z.any()),
      purchaseHistory: z.array(z.string()),
      viewHistory: z.array(z.string()),
      demographics: z.object({
        ageGroup: z.string().optional(),
        gender: z.string().optional(),
        location: z.string().optional(),
      }).optional(),
    }),
  }),
  execute: async ({ inputData }) => {
    // 模拟获取用户画像
    const userProfile = {
      preferences: {
        brands: ['Apple', 'Samsung', 'Huawei'],
        categories: ['Electronics', 'Fashion', 'Books'],
        priceRange: { min: 100, max: 5000 },
        features: ['high-quality', 'durable', 'innovative'],
      },
      purchaseHistory: ['item_001', 'item_005', 'item_012'],
      viewHistory: ['item_002', 'item_007', 'item_015', 'item_020'],
      demographics: {
        ageGroup: '25-35',
        gender: 'unspecified',
        location: 'Beijing',
      },
    };

    return {
      ...inputData,
      userProfile,
    };
  },
});

// 步骤2: 生成候选商品
const generateCandidatesStep = createStep({
  id: 'generateCandidates',
  inputSchema: z.object({
    userId: z.string(),
    requestType: z.enum(['similar', 'personalized', 'trending', 'category']),
    context: z.object({
      itemId: z.string().optional(),
      category: z.string().optional(),
      priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
      userPreferences: z.record(z.string(), z.any()).optional(),
      excludeItems: z.array(z.string()).optional(),
    }),
    limit: z.number(),
    userProfile: z.object({
      preferences: z.record(z.string(), z.any()),
      purchaseHistory: z.array(z.string()),
      viewHistory: z.array(z.string()),
      demographics: z.object({
        ageGroup: z.string().optional(),
        gender: z.string().optional(),
        location: z.string().optional(),
      }).optional(),
    }),
  }),
  outputSchema: z.object({
    userId: z.string(),
    requestType: z.enum(['similar', 'personalized', 'trending', 'category']),
    context: z.object({
      itemId: z.string().optional(),
      category: z.string().optional(),
      priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
      userPreferences: z.record(z.string(), z.any()).optional(),
      excludeItems: z.array(z.string()).optional(),
    }),
    limit: z.number(),
    candidates: z.array(z.object({
      itemId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      price: z.number(),
      category: z.string(),
      tags: z.array(z.string()).optional(),
      imageUrl: z.string().optional(),
      features: z.record(z.string(), z.any()).optional(),
    })),
  }),
  execute: async ({ inputData }) => {
    // 模拟生成候选商品
    const allItems = [
      {
        itemId: 'item_101',
        title: 'iPhone 15 Pro Max',
        description: '最新款iPhone，配备A17 Pro芯片',
        price: 9999,
        category: 'Electronics',
        tags: ['smartphone', 'apple', 'premium'],
        imageUrl: 'https://example.com/iphone15.jpg',
        features: { brand: 'Apple', storage: '256GB', color: 'Natural Titanium' },
      },
      {
        itemId: 'item_102',
        title: 'MacBook Air M3',
        description: '轻薄便携的笔记本电脑',
        price: 8999,
        category: 'Electronics',
        tags: ['laptop', 'apple', 'portable'],
        imageUrl: 'https://example.com/macbook.jpg',
        features: { brand: 'Apple', processor: 'M3', ram: '8GB' },
      },
      {
        itemId: 'item_103',
        title: 'Samsung Galaxy S24',
        description: 'Android旗舰手机',
        price: 7999,
        category: 'Electronics',
        tags: ['smartphone', 'samsung', 'android'],
        imageUrl: 'https://example.com/galaxy.jpg',
        features: { brand: 'Samsung', storage: '128GB', color: 'Phantom Black' },
      },
      {
        itemId: 'item_104',
        title: 'AirPods Pro 2',
        description: '主动降噪无线耳机',
        price: 1899,
        category: 'Electronics',
        tags: ['headphones', 'apple', 'wireless'],
        imageUrl: 'https://example.com/airpods.jpg',
        features: { brand: 'Apple', type: 'wireless', noise_cancelling: true },
      },
      {
        itemId: 'item_105',
        title: 'Nike Air Max 270',
        description: '舒适运动鞋',
        price: 899,
        category: 'Fashion',
        tags: ['shoes', 'nike', 'sports'],
        imageUrl: 'https://example.com/nike.jpg',
        features: { brand: 'Nike', size: '42', color: 'Black/White' },
      },
    ];

    let candidates = allItems;

    // 根据请求类型过滤候选商品
    switch (inputData.requestType) {
      case 'category':
        if (inputData.context.category) {
          candidates = candidates.filter(item => item.category === inputData.context.category);
        }
        break;
      case 'similar':
        // 模拟相似商品推荐（实际应该基于商品特征相似度）
        if (inputData.context.itemId) {
          candidates = candidates.filter(item => item.itemId !== inputData.context.itemId);
        }
        break;
      case 'personalized':
        // 基于用户偏好过滤
        const userBrands = inputData.userProfile.preferences.brands as string[] || [];
        candidates = candidates.filter(item => 
          userBrands.some(brand => item.features?.brand === brand)
        );
        break;
      case 'trending':
        // 返回热门商品（这里简化为前几个）
        candidates = candidates.slice(0, 3);
        break;
    }

    // 应用价格过滤
    if (inputData.context.priceRange) {
      const { min, max } = inputData.context.priceRange;
      candidates = candidates.filter(item => {
        if (min && item.price < min) return false;
        if (max && item.price > max) return false;
        return true;
      });
    }

    // 排除指定商品
    if (inputData.context.excludeItems) {
      candidates = candidates.filter(item => 
        !inputData.context.excludeItems!.includes(item.itemId)
      );
    }

    return {
      userId: inputData.userId,
      requestType: inputData.requestType,
      context: inputData.context,
      limit: inputData.limit,
      candidates,
    };
  },
});

// 步骤3: 计算推荐分数
const calculateScoresStep = createStep({
  id: 'calculateScores',
  inputSchema: z.object({
    userId: z.string(),
    requestType: z.enum(['similar', 'personalized', 'trending', 'category']),
    context: z.object({
      itemId: z.string().optional(),
      category: z.string().optional(),
      priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
      userPreferences: z.record(z.string(), z.any()).optional(),
      excludeItems: z.array(z.string()).optional(),
    }),
    limit: z.number(),
    candidates: z.array(z.object({
      itemId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      price: z.number(),
      category: z.string(),
      tags: z.array(z.string()).optional(),
      imageUrl: z.string().optional(),
      features: z.record(z.string(), z.any()).optional(),
    })),
  }),
  outputSchema: RecommendationWorkflowOutputSchema,
  execute: async ({ inputData, mastra }) => {
    // 使用Recommendation Agent进行智能推荐分析
    const agent = mastra.getAgent('recommendation');
    
    const prompt = `
作为智能推荐系统，请分析以下候选商品并生成推荐结果：

推荐类型: ${inputData.requestType}
用户ID: ${inputData.userId}
推荐上下文: ${JSON.stringify(inputData.context)}
候选商品: ${JSON.stringify(inputData.candidates)}

请为每个候选商品计算推荐分数(0-1之间)和推荐理由，并按分数排序。
返回JSON格式，包含以下字段：
- recommendations: 推荐商品列表，每个包含itemId、title、description、price、category、score、reason、tags、imageUrl
- metadata: 包含totalCount、algorithm、timestamp、requestType

请确保推荐分数合理，推荐理由具体且有说服力。
`;

    try {
      const response = await agent.generate(prompt, {
        memory: {
          thread: `recommendation_${inputData.requestType}`,
          resource: inputData.userId
        }
      });

      // 解析Agent响应
      let agentResult;
      try {
        agentResult = JSON.parse(response.text);
      } catch (parseError) {
        console.error('Failed to parse recommendation agent response:', parseError);
        // 使用后备方案
        agentResult = null;
      }

      // 如果Agent响应有效，使用Agent结果
      if (agentResult && agentResult.recommendations) {
        return {
          recommendations: agentResult.recommendations.slice(0, inputData.limit),
          metadata: {
            totalCount: agentResult.recommendations.length,
            algorithm: `ai_${inputData.requestType}_recommendation`,
            timestamp: new Date().toISOString(),
            requestType: inputData.requestType,
          },
        };
      }
    } catch (error) {
      console.error('Recommendation agent failed:', error);
    }

    // 后备方案：使用规则推荐
    const recommendations = inputData.candidates.map(item => {
      let score = 0.5; // 基础分数
      let reason = '';

      // 根据推荐类型调整分数和理由
      switch (inputData.requestType) {
        case 'personalized':
          score = 0.8 + Math.random() * 0.2;
          reason = '基于您的购买历史和偏好推荐';
          break;
        case 'similar':
          score = 0.7 + Math.random() * 0.3;
          reason = '与您查看的商品相似';
          break;
        case 'trending':
          score = 0.9 + Math.random() * 0.1;
          reason = '当前热门商品';
          break;
        case 'category':
          score = 0.6 + Math.random() * 0.4;
          reason = `${item.category}类别推荐`;
          break;
      }

      // 价格因素调整
      if (item.price < 1000) {
        score += 0.1; // 便宜商品加分
        reason += '，价格实惠';
      } else if (item.price > 5000) {
        score -= 0.1; // 昂贵商品减分
        reason += '，高端品质';
      }

      return {
        itemId: item.itemId,
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        score: Math.round(score * 100) / 100, // 保留两位小数
        reason,
        tags: item.tags,
        imageUrl: item.imageUrl,
      };
    });

    // 按分数排序并限制数量
    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, inputData.limit);

    return {
      recommendations: sortedRecommendations,
      metadata: {
        totalCount: sortedRecommendations.length,
        algorithm: `rule_${inputData.requestType}_recommendation`,
        timestamp: new Date().toISOString(),
        requestType: inputData.requestType,
      },
    };
  },
});

// 创建推荐工作流
export const recommendationWorkflow = createWorkflow({
  id: 'recommendationWorkflow',
  inputSchema: RecommendationWorkflowInputSchema,
  outputSchema: RecommendationWorkflowOutputSchema,
})
  .then(getUserProfileStep)
  .then(generateCandidatesStep)
  .then(calculateScoresStep);

recommendationWorkflow.commit();

export type RecommendationWorkflowInput = z.infer<typeof RecommendationWorkflowInputSchema>;
export type RecommendationWorkflowOutput = z.infer<typeof RecommendationWorkflowOutputSchema>;