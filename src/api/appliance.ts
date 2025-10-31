// API端点类型定义
interface ApiRequest {
  method?: string;
  body: any;
}

interface ApiResponse {
  status: (code: number) => {
    json: (data: any) => void;
  };
}
import { mastra } from '../mastra';
import { z } from 'zod';

// API请求Schema
const ApplianceRequestSchema = z.object({
  query: z.string().min(1, '查询内容不能为空'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  preferences: z.object({
    categories: z.array(z.string()).optional(),
    brands: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    styles: z.array(z.string()).optional(),
  }).optional(),
});

// API响应Schema
const ApplianceResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    recommendations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      brand: z.string(),
      category: z.string(),
      price: z.number(),
      features: z.array(z.string()),
      rating: z.number(),
      description: z.string(),
      imageUrl: z.string().optional(),
    })),
    analysis: z.string(),
    memoryUpdated: z.boolean(),
  }),
  message: z.string().optional(),
  error: z.string().optional(),
});

export default async function handler(
  req: ApiRequest,
  res: ApiResponse
) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: '只支持POST请求',
    });
  }

  try {
    // 验证请求数据
    const validatedData = ApplianceRequestSchema.parse(req.body);
    const { query, userId, sessionId, preferences } = validatedData;

    console.log('收到家电推荐请求:', { query, userId, preferences });

    // 模拟智能推荐逻辑
    const recommendations = generateMockRecommendations(query, preferences);
    const analysis = generateAnalysis(query, preferences);

    // 构建响应数据
    const response = {
      success: true,
      data: {
        recommendations,
        analysis,
        memoryUpdated: true,
      },
      message: '推荐生成成功',
    };

    console.log('返回推荐结果:', response);

    // 验证响应格式
    const validatedResponse = ApplianceResponseSchema.parse(response);

    res.status(200).json(validatedResponse);

  } catch (error) {
    console.error('家电推荐API错误:', error);

    // 处理验证错误
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '请求参数验证失败',
        details: error.issues,
      });
    }

    // 处理其他错误
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误',
    });
  }
}

// 生成模拟推荐数据
function generateMockRecommendations(query: string, preferences?: any) {
  const baseRecommendations = [
    {
      id: 'rec_001',
      name: '小米智能空气净化器 Pro',
      brand: '小米',
      category: '空气净化器',
      price: 1299,
      features: ['HEPA滤网', '智能控制', '静音运行', 'APP远程控制'],
      rating: 4.5,
      description: '高效净化PM2.5，智能控制，适合家庭使用',
      imageUrl: 'https://example.com/xiaomi-air-purifier.jpg',
    },
    {
      id: 'rec_002',
      name: '海尔变频洗衣机 10KG',
      brand: '海尔',
      category: '洗衣机',
      price: 2899,
      features: ['变频电机', '智能投放', '蒸汽除菌', '大容量'],
      rating: 4.3,
      description: '节能环保，洗涤效果好，适合大家庭',
      imageUrl: 'https://example.com/haier-washing-machine.jpg',
    },
    {
      id: 'rec_003',
      name: '格力变频空调 1.5匹',
      brand: '格力',
      category: '空调',
      price: 3299,
      features: ['变频节能', '快速制冷', '智能温控', '静音运行'],
      rating: 4.4,
      description: '制冷效果好，节能省电，性价比高',
      imageUrl: 'https://example.com/gree-air-conditioner.jpg',
    },
  ];

  // 根据查询内容和偏好过滤推荐
  let filteredRecommendations = baseRecommendations;

  if (preferences?.categories && preferences.categories.length > 0) {
    filteredRecommendations = filteredRecommendations.filter(item =>
      preferences.categories.some((cat: string) => 
        item.category.includes(cat) || item.name.includes(cat)
      )
    );
  }

  if (preferences?.brands && preferences.brands.length > 0) {
    filteredRecommendations = filteredRecommendations.filter(item =>
      preferences.brands.some((brand: string) => 
        item.brand.includes(brand)
      )
    );
  }

  if (preferences?.priceRange) {
    const { min, max } = preferences.priceRange;
    filteredRecommendations = filteredRecommendations.filter(item =>
      item.price >= min && item.price <= max
    );
  }

  // 如果过滤后没有结果，返回所有推荐
  return filteredRecommendations.length > 0 ? filteredRecommendations : baseRecommendations;
}

// 生成分析文本
function generateAnalysis(query: string, preferences?: any) {
  let analysis = `基于您的查询"${query}"，我为您分析了以下几个方面：\n\n`;
  
  analysis += `🎯 **需求分析**：您正在寻找${query}相关的家电产品\n`;
  
  if (preferences?.categories && preferences.categories.length > 0) {
    analysis += `📋 **类别偏好**：您关注${preferences.categories.join('、')}等类别\n`;
  }
  
  if (preferences?.brands && preferences.brands.length > 0) {
    analysis += `🏷️ **品牌偏好**：您偏好${preferences.brands.join('、')}等品牌\n`;
  }
  
  if (preferences?.priceRange) {
    analysis += `💰 **价格范围**：您的预算在${preferences.priceRange.min}-${preferences.priceRange.max}元之间\n`;
  }
  
  analysis += `\n✨ **推荐理由**：基于您的需求和偏好，我为您推荐了几款性价比高、用户评价好的产品，它们在功能、品质和价格方面都有很好的平衡。`;
  
  return analysis;
}

// 导出类型定义
export type ApplianceRequest = z.infer<typeof ApplianceRequestSchema>;
export type ApplianceResponse = z.infer<typeof ApplianceResponseSchema>;