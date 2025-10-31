import { z } from 'zod';
import { ToolsConfig } from './tools-config';

// 商品详情输入Schema
export const GetProductDetailsInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  fields: z.array(z.string()).optional().describe('Specific fields to retrieve'),
  includeReviews: z.boolean().default(false).describe('Whether to include review data'),
  includeRecommendations: z.boolean().default(false).describe('Whether to include related products'),
  locale: z.string().default('en-US').describe('Locale for localized content'),
});

// 商品详情输出Schema
export const GetProductDetailsOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.object({
      current: z.number(),
      original: z.number().optional(),
      currency: z.string(),
      discount: z.number().optional(),
    }),
    category: z.object({
      id: z.string(),
      name: z.string(),
      path: z.array(z.string()),
    }),
    brand: z.object({
      id: z.string(),
      name: z.string(),
      logo: z.string().optional(),
    }),
    images: z.array(z.object({
      url: z.string(),
      alt: z.string().optional(),
      type: z.enum(['main', 'gallery', 'thumbnail']),
    })),
    rating: z.object({
      average: z.number(),
      count: z.number(),
      distribution: z.record(z.string(), z.number()).optional(),
    }),
    availability: z.object({
      inStock: z.boolean(),
      quantity: z.number().optional(),
      status: z.string(),
      estimatedDelivery: z.string().optional(),
    }),
    specifications: z.record(z.string(), z.any()).optional(),
    tags: z.array(z.string()),
    reviews: z.array(z.object({
      id: z.string(),
      userId: z.string(),
      rating: z.number(),
      title: z.string(),
      content: z.string(),
      date: z.string(),
      verified: z.boolean(),
    })).optional(),
    recommendations: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      image: z.string(),
      rating: z.number(),
      type: z.enum(['similar', 'complementary', 'alternative']),
    })).optional(),
    metadata: z.object({
      lastUpdated: z.string(),
      source: z.string(),
      version: z.string(),
    }),
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  metadata: z.object({
    requestId: z.string(),
    timestamp: z.string(),
    processingTime: z.number(),
    cached: z.boolean(),
    source: z.string(),
  }),
});

export type GetProductDetailsInput = z.infer<typeof GetProductDetailsInputSchema>;
export type GetProductDetailsOutput = z.infer<typeof GetProductDetailsOutputSchema>;

/**
 * 商品详情工具类
 * 负责从各种数据源获取商品的详细信息
 */
export class GetProductDetailsTool {
  private config = ToolsConfig.productDetails;
  private cache = new Map<string, { data: any; timestamp: number }>();

  constructor() {
    // 初始化缓存清理定时器
    if (this.config.cache.enabled) {
      setInterval(() => this.cleanupCache(), 60000); // 每分钟清理一次
    }
  }

  /**
   * 获取商品详情
   */
  async execute(input: GetProductDetailsInput): Promise<GetProductDetailsOutput> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // 验证输入
      const validatedInput = GetProductDetailsInputSchema.parse(input);

      // 检查缓存
      const cacheKey = this.generateCacheKey(validatedInput);
      const cachedResult = this.getFromCache(cacheKey);
      
      if (cachedResult) {
        return {
          success: true,
          data: cachedResult,
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            cached: true,
            source: 'cache',
          },
        };
      }

      // 获取商品数据
      const productData = await this.fetchProductData(validatedInput);

      // 缓存结果
      if (this.config.cache.enabled && productData) {
        this.setCache(cacheKey, productData);
      }

      return {
        success: true,
        data: productData,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          cached: false,
          source: 'api',
        },
      };

    } catch (error) {
      console.error('GetProductDetailsTool error:', error);

      return {
        success: false,
        error: {
          code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          details: error,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          cached: false,
          source: 'error',
        },
      };
    }
  }

  /**
   * 从API获取商品数据
   */
  private async fetchProductData(input: GetProductDetailsInput): Promise<any> {
    // 构建API请求
    const url = `${this.config.api.baseUrl}/products/${input.productId}`;
    const params = new URLSearchParams();

    // 添加查询参数
    if (input.fields && input.fields.length > 0) {
      params.append('fields', input.fields.join(','));
    } else {
      params.append('fields', this.config.defaultFields.join(','));
    }

    if (input.includeReviews) {
      params.append('include_reviews', 'true');
    }

    if (input.includeRecommendations) {
      params.append('include_recommendations', 'true');
    }

    params.append('locale', input.locale);

    // 模拟API调用（实际实现中应该使用真实的HTTP客户端）
    const mockApiResponse = await this.mockApiCall(input.productId, input);

    // 转换数据格式
    return this.transformProductData(mockApiResponse, input);
  }

  /**
   * 模拟API调用（用于演示）
   */
  private async mockApiCall(productId: string, input: GetProductDetailsInput): Promise<any> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // 模拟不同的响应情况
    if (productId === 'not-found') {
      throw new Error('Product not found');
    }

    if (productId === 'error') {
      throw new Error('API error');
    }

    // 返回模拟数据
    return {
      product_id: productId,
      title: `Sample Product ${productId}`,
      description: `This is a detailed description of product ${productId}. It includes all the important features and specifications.`,
      price: 99.99,
      original_price: 129.99,
      currency: 'USD',
      category: {
        id: 'electronics',
        name: 'Electronics',
        path: ['Home', 'Electronics', 'Smartphones'],
      },
      brand: {
        id: 'apple',
        name: 'Apple',
        logo: 'https://example.com/logos/apple.png',
      },
      image_urls: [
        {
          url: `https://example.com/images/${productId}_main.jpg`,
          type: 'main',
          alt: `Main image of product ${productId}`,
        },
        {
          url: `https://example.com/images/${productId}_gallery1.jpg`,
          type: 'gallery',
          alt: `Gallery image 1 of product ${productId}`,
        },
      ],
      average_rating: 4.5,
      review_count: 1234,
      in_stock: true,
      quantity: 50,
      tags: ['popular', 'new-arrival', 'bestseller'],
      specs: {
        color: 'Space Gray',
        storage: '128GB',
        display: '6.1-inch',
        camera: '12MP',
      },
      reviews: input.includeReviews ? [
        {
          id: 'review_1',
          user_id: 'user_123',
          rating: 5,
          title: 'Excellent product!',
          content: 'I love this product. It works perfectly and exceeded my expectations.',
          date: '2024-01-15T10:30:00Z',
          verified: true,
        },
        {
          id: 'review_2',
          user_id: 'user_456',
          rating: 4,
          title: 'Good value for money',
          content: 'Great product for the price. Highly recommended.',
          date: '2024-01-10T14:20:00Z',
          verified: true,
        },
      ] : undefined,
      recommendations: input.includeRecommendations ? [
        {
          id: 'rec_1',
          name: 'Similar Product 1',
          price: 89.99,
          image: 'https://example.com/images/rec_1.jpg',
          rating: 4.3,
          type: 'similar',
        },
        {
          id: 'rec_2',
          name: 'Complementary Product',
          price: 29.99,
          image: 'https://example.com/images/rec_2.jpg',
          rating: 4.7,
          type: 'complementary',
        },
      ] : undefined,
      last_updated: new Date().toISOString(),
      source: 'product_api',
      version: '1.0',
    };
  }

  /**
   * 转换API数据为标准格式
   */
  private transformProductData(apiData: any, input: GetProductDetailsInput): any {
    const mapping = this.config.fieldMapping;

    return {
      id: apiData[mapping.id],
      name: apiData[mapping.name],
      description: apiData[mapping.description],
      price: {
        current: apiData[mapping.price],
        original: apiData.original_price,
        currency: apiData.currency,
        discount: apiData.original_price ? 
          Math.round(((apiData.original_price - apiData[mapping.price]) / apiData.original_price) * 100) : 
          undefined,
      },
      category: apiData.category,
      brand: apiData.brand,
      images: apiData[mapping.images] || [],
      rating: {
        average: apiData[mapping.rating],
        count: apiData[mapping.reviews],
        distribution: undefined, // 可以从详细评论数据计算
      },
      availability: {
        inStock: apiData[mapping.availability],
        quantity: apiData.quantity,
        status: apiData[mapping.availability] ? 'in_stock' : 'out_of_stock',
        estimatedDelivery: apiData[mapping.availability] ? '2-3 business days' : undefined,
      },
      specifications: apiData[mapping.specifications],
      tags: apiData[mapping.tags] || [],
      reviews: apiData.reviews,
      recommendations: apiData.recommendations,
      metadata: {
        lastUpdated: apiData.last_updated,
        source: apiData.source,
        version: apiData.version,
      },
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(input: GetProductDetailsInput): string {
    const key = `${input.productId}_${input.fields?.join(',') || 'default'}_${input.includeReviews}_${input.includeRecommendations}_${input.locale}`;
    return `${this.config.cache.keyPrefix}${key}`;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache(key: string): any | null {
    if (!this.config.cache.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cache.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: any): void {
    if (!this.config.cache.enabled) return;

    // 检查缓存大小限制
    if (this.cache.size >= this.config.cache.maxSize) {
      // 删除最旧的条目
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    if (!this.config.cache.enabled) return;

    const now = Date.now();
    const ttlMs = this.config.cache.ttl * 1000;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取工具状态
   */
  getStatus(): { healthy: boolean; cacheSize: number; lastCleanup: string } {
    return {
      healthy: true,
      cacheSize: this.cache.size,
      lastCleanup: new Date().toISOString(),
    };
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// 创建工具实例
export const getProductDetailsTool = new GetProductDetailsTool();