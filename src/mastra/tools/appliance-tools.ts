import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 家电产品类型定义
interface ApplianceProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  rating: number;
  features: string[];
  pros: string[];
  cons: string[];
  energyRating: string;
  capacity: number;
  category: string;
  availability: boolean;
}

// 家电数据库（模拟数据）
const applianceDatabase: Record<string, ApplianceProduct[]> = {
  refrigerator: [
    {
      id: 'ref001',
      name: '海尔BCD-470WDPG',
      brand: '海尔',
      model: 'BCD-470WDPG',
      price: 3299,
      rating: 4.5,
      features: ['变频压缩机', '风冷无霜', '干湿分储', '智能控制'],
      pros: ['节能省电', '保鲜效果好', '噪音低'],
      cons: ['价格偏高', '占地面积大'],
      energyRating: 'A++',
      capacity: 470,
      category: 'refrigerator',
      availability: true,
    },
    {
      id: 'ref002',
      name: '美的BCD-516WKPZM',
      brand: '美的',
      model: 'BCD-516WKPZM',
      price: 2899,
      rating: 4.3,
      features: ['十字对开门', '变频节能', '净味杀菌', '大容量'],
      pros: ['性价比高', '容量大', '设计美观'],
      cons: ['制冷速度一般', '门封条易老化'],
      energyRating: 'A+',
      capacity: 516,
      category: 'refrigerator',
      availability: true,
    },
  ],
  washing_machine: [
    {
      id: 'wm001',
      name: '小米米家洗烘一体机10kg',
      brand: '小米',
      model: 'XHQG100MJ311',
      price: 1999,
      rating: 4.4,
      features: ['洗烘一体', '变频电机', '智能投放', 'APP控制'],
      pros: ['智能化程度高', '洗烘一体方便', '性价比优秀'],
      cons: ['烘干效果一般', '噪音稍大'],
      energyRating: 'A+++',
      capacity: 10,
      category: 'washing_machine',
      availability: true,
    },
    {
      id: 'wm002',
      name: '海尔EG100HBDC8SU1',
      brand: '海尔',
      model: 'EG100HBDC8SU1',
      price: 2599,
      rating: 4.6,
      features: ['直驱变频', '蒸汽除菌', '智能投放', '大容量'],
      pros: ['洗净效果好', '运行稳定', '除菌效果佳'],
      cons: ['价格较高', '功能复杂'],
      energyRating: 'A+++',
      capacity: 10,
      category: 'washing_machine',
      availability: true,
    },
  ],
  air_conditioner: [
    {
      id: 'ac001',
      name: '格力KFR-35GW/NhAa1BAj',
      brand: '格力',
      model: 'KFR-35GW/NhAa1BAj',
      price: 2299,
      rating: 4.5,
      features: ['变频节能', '快速制冷', '智能控制', '静音运行'],
      pros: ['制冷效果好', '节能省电', '品质可靠'],
      cons: ['外观一般', '智能化程度不高'],
      energyRating: 'A++',
      capacity: 1.5,
      category: 'air_conditioner',
      availability: true,
    },
    {
      id: 'ac002',
      name: '美的KFR-35GW/BP2DN8Y-PH200(B1)',
      brand: '美的',
      model: 'KFR-35GW/BP2DN8Y-PH200(B1)',
      price: 1899,
      rating: 4.3,
      features: ['全直流变频', '智能控制', '自清洁', '快速制冷'],
      pros: ['性价比高', '制冷快', '自清洁方便'],
      cons: ['噪音稍大', '遥控器功能复杂'],
      energyRating: 'A+',
      capacity: 1.5,
      category: 'air_conditioner',
      availability: true,
    },
  ],
};

// 家电查询工具
export const applianceSearchTool = createTool({
  id: 'search-appliances',
  description: '根据条件搜索家电产品',
  inputSchema: z.object({
    category: z.enum(['refrigerator', 'washing_machine', 'air_conditioner', 'microwave', 'dishwasher', 'oven']).describe('家电类型'),
    maxPrice: z.number().optional().describe('最大价格'),
    minRating: z.number().min(0).max(5).optional().describe('最低评分'),
    energyRating: z.string().optional().describe('能效等级'),
    brand: z.string().optional().describe('品牌偏好'),
  }),
  outputSchema: z.array(z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string(),
    model: z.string(),
    price: z.number(),
    rating: z.number(),
    features: z.array(z.string()),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    energyRating: z.string(),
    capacity: z.number(),
    category: z.string(),
    availability: z.boolean(),
  })),
  execute: async ({ context }) => {
    const { category, maxPrice, minRating, energyRating, brand } = context;
    
    let products = applianceDatabase[category] || [];
    
    // 应用过滤条件
    if (maxPrice) {
      products = products.filter(p => p.price <= maxPrice);
    }
    
    if (minRating) {
      products = products.filter(p => p.rating >= minRating);
    }
    
    if (energyRating) {
      products = products.filter(p => p.energyRating === energyRating);
    }
    
    if (brand) {
      products = products.filter(p => p.brand.toLowerCase().includes(brand.toLowerCase()));
    }
    
    // 按评分和价格排序
    products.sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      if (Math.abs(ratingDiff) < 0.1) {
        return a.price - b.price; // 评分相近时按价格排序
      }
      return ratingDiff;
    });
    
    return products;
  },
});

// 家电对比工具
export const applianceCompareTool = createTool({
  id: 'compare-appliances',
  description: '对比多个家电产品',
  inputSchema: z.object({
    productIds: z.array(z.string()).min(2).max(5).describe('要对比的产品ID列表'),
  }),
  outputSchema: z.object({
    comparison: z.array(z.object({
      id: z.string(),
      name: z.string(),
      brand: z.string(),
      price: z.number(),
      rating: z.number(),
      features: z.array(z.string()),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      energyRating: z.string(),
      capacity: z.number(),
    })),
    summary: z.string(),
    recommendation: z.string(),
  }),
  execute: async ({ context }) => {
    const { productIds } = context;
    
    const allProducts = [
      ...applianceDatabase.refrigerator,
      ...applianceDatabase.washing_machine,
      ...applianceDatabase.air_conditioner,
    ];
    
    const products = productIds.map(id => 
      allProducts.find(p => p.id === id)
    ).filter((p): p is ApplianceProduct => p !== undefined);
    
    if (products.length < 2) {
      throw new Error('至少需要2个有效的产品ID进行对比');
    }
    
    // 生成对比总结
    const priceRange = {
      min: Math.min(...products.map(p => p.price)),
      max: Math.max(...products.map(p => p.price)),
    };
    
    const avgRating = products.reduce((sum, p) => sum + p.rating, 0) / products.length;
    
    const summary = `对比了${products.length}款产品，价格范围：¥${priceRange.min}-${priceRange.max}，平均评分：${avgRating.toFixed(1)}`;
    
    // 生成推荐
    const bestRated = products.reduce((best, current) => 
      current.rating > best.rating ? current : best
    );
    
    const mostAffordable = products.reduce((cheapest, current) => 
      current.price < cheapest.price ? current : cheapest
    );
    
    let recommendation = `最高评分：${bestRated.name}（${bestRated.rating}分）`;
    if (bestRated.id !== mostAffordable.id) {
      recommendation += `，最实惠：${mostAffordable.name}（¥${mostAffordable.price}）`;
    }
    
    return {
      comparison: products,
      summary,
      recommendation,
    };
  },
});

// 家电推荐工具
export const applianceRecommendTool = createTool({
  id: 'recommend-appliances',
  description: '基于用户需求推荐家电',
  inputSchema: z.object({
    category: z.enum(['refrigerator', 'washing_machine', 'air_conditioner', 'microwave', 'dishwasher', 'oven']).describe('家电类型'),
    budget: z.number().min(0).describe('预算范围（元）'),
    familySize: z.number().min(1).max(10).describe('家庭人数'),
    roomSize: z.number().optional().describe('房间面积（平方米）'),
    preferences: z.array(z.string()).optional().describe('特殊偏好'),
  }),
  outputSchema: z.object({
    recommendations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      brand: z.string(),
      price: z.number(),
      rating: z.number(),
      features: z.array(z.string()),
      suitability: z.string(),
      score: z.number(),
    })),
    reasoning: z.string(),
    tips: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { category, budget, familySize, roomSize, preferences = [] } = context;
    
    let products = applianceDatabase[category] || [];
    
    // 过滤预算范围内的产品
    products = products.filter(p => p.price <= budget * 1.1); // 允许10%的预算超出
    
    // 计算推荐分数
    const scoredProducts = products.map(product => {
      let score = product.rating * 20; // 基础分数（满分100）
      
      // 价格分数（预算内越便宜分数越高）
      const priceScore = Math.max(0, (budget - product.price) / budget * 20);
      score += priceScore;
      
      // 容量适配分数
      if (category === 'refrigerator' || category === 'washing_machine') {
        const idealCapacity = familySize * (category === 'refrigerator' ? 80 : 1.5);
        const capacityDiff = Math.abs(product.capacity - idealCapacity);
        const capacityScore = Math.max(0, 20 - capacityDiff * 2);
        score += capacityScore;
      }
      
      // 偏好匹配分数
      const preferenceMatches = preferences.filter(pref => 
        product.features.some(feature => 
          feature.toLowerCase().includes(pref.toLowerCase())
        )
      ).length;
      score += preferenceMatches * 5;
      
      // 能效分数
      const energyScores: Record<string, number> = { 'A+++': 15, 'A++': 12, 'A+': 8, 'A': 5, 'B': 2 };
      score += energyScores[product.energyRating] || 0;
      
      return {
        ...product,
        score: Math.min(100, score),
        suitability: generateSuitability(product, familySize, roomSize),
      };
    });
    
    // 排序并取前3名
    const topRecommendations = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    const reasoning = generateReasoning(topRecommendations, budget, familySize);
    const tips = generateTips(category, budget, familySize);
    
    return {
      recommendations: topRecommendations,
      reasoning,
      tips,
    };
  },
});

// 辅助函数
function generateSuitability(product: any, familySize: number, roomSize?: number): string {
  const suitabilityFactors = [];
  
  if (product.category === 'refrigerator') {
    if (product.capacity >= familySize * 70) {
      suitabilityFactors.push('容量充足');
    }
    if (product.energyRating.includes('A+')) {
      suitabilityFactors.push('节能环保');
    }
  }
  
  if (product.category === 'air_conditioner' && roomSize) {
    const suitableArea = product.capacity * 12; // 1匹适合12平米
    if (roomSize <= suitableArea) {
      suitabilityFactors.push('制冷能力匹配');
    }
  }
  
  if (product.rating >= 4.5) {
    suitabilityFactors.push('用户评价优秀');
  }
  
  return suitabilityFactors.join('，') || '基本适用';
}

function generateReasoning(recommendations: any[], budget: number, familySize: number): string {
  if (recommendations.length === 0) {
    return '在您的预算范围内暂未找到合适的产品，建议适当调整预算或需求。';
  }
  
  const topProduct = recommendations[0];
  let reasoning = `推荐${topProduct.name}作为首选，`;
  
  if (topProduct.score >= 80) {
    reasoning += '综合评分很高，';
  }
  
  if (topProduct.price <= budget * 0.8) {
    reasoning += '价格实惠，';
  }
  
  reasoning += `适合${familySize}人家庭使用。`;
  
  if (recommendations.length > 1) {
    reasoning += ` 另外推荐${recommendations[1].name}作为备选。`;
  }
  
  return reasoning;
}

function generateTips(category: string, budget: number, familySize: number): string[] {
  const tips = [];
  
  switch (category) {
    case 'refrigerator':
      tips.push('建议选择变频压缩机，更节能耐用');
      tips.push('风冷无霜技术可以减少手动除霜的麻烦');
      if (familySize >= 4) {
        tips.push('大家庭建议选择400L以上容量');
      }
      break;
    case 'washing_machine':
      tips.push('变频电机噪音更小，寿命更长');
      tips.push('洗烘一体机适合空间有限的家庭');
      break;
    case 'air_conditioner':
      tips.push('变频空调虽然价格高，但长期使用更省电');
      tips.push('选择时要考虑房间朝向和保温情况');
      break;
  }
  
  if (budget < 2000) {
    tips.push('预算有限时，优先考虑基础功能和品牌可靠性');
  }
  
  tips.push('购买前建议查看最新的用户评价和售后服务政策');
  
  return tips;
}