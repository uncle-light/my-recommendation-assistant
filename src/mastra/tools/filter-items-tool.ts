import { z } from 'zod';
import { ToolsConfig } from './tools-config';

// 过滤条件Schema
export const FilterConditionSchema = z.object({
  field: z.string().min(1, 'Filter field is required'),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'startsWith', 'endsWith', 'between']),
  value: z.any().describe('Filter value(s)'),
  values: z.array(z.any()).optional().describe('Multiple values for in/nin operators'),
});

// 排序条件Schema
export const SortConditionSchema = z.object({
  field: z.string().min(1, 'Sort field is required'),
  order: z.enum(['asc', 'desc']).default('asc'),
  priority: z.number().int().min(1).optional().describe('Sort priority (1 = highest)'),
});

// 分页Schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).optional(),
});

// 商品过滤输入Schema
export const FilterItemsInputSchema = z.object({
  // 基本查询
  query: z.string().optional().describe('Text search query'),
  
  // 过滤条件
  filters: z.array(FilterConditionSchema).optional().describe('Filter conditions'),
  
  // 排序条件
  sort: z.array(SortConditionSchema).optional().describe('Sort conditions'),
  
  // 分页
  pagination: PaginationSchema.optional(),
  
  // 字段选择
  fields: z.array(z.string()).optional().describe('Fields to include in response'),
  
  // 聚合选项
  aggregations: z.object({
    categories: z.boolean().optional(),
    brands: z.boolean().optional(),
    priceRanges: z.boolean().optional(),
    ratings: z.boolean().optional(),
    tags: z.boolean().optional(),
  }).optional().describe('Include aggregation data'),
  
  // 用户上下文
  userContext: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    preferences: z.record(z.string(), z.any()).optional(),
    location: z.object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
    }).optional(),
    device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  }).optional().describe('User context for personalization'),
  
  // 高级选项
  options: z.object({
    includeOutOfStock: z.boolean().default(false),
    includeDiscontinued: z.boolean().default(false),
    boostPopular: z.boolean().default(true),
    boostRecommended: z.boolean().default(true),
    diversityFactor: z.number().min(0).max(1).default(0.3),
    freshnessFactor: z.number().min(0).max(1).default(0.1),
  }).optional().describe('Advanced filtering options'),
});

// 商品项Schema
export const ProductItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  originalPrice: z.number().optional(),
  discount: z.number().optional(),
  category: z.string(),
  brand: z.string().optional(),
  images: z.array(z.string()).optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  availability: z.boolean(),
  tags: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  score: z.number().optional().describe('Relevance/ranking score'),
});

// 聚合数据Schema
export const AggregationDataSchema = z.object({
  categories: z.array(z.object({
    name: z.string(),
    count: z.number(),
    percentage: z.number(),
  })).optional(),
  brands: z.array(z.object({
    name: z.string(),
    count: z.number(),
    percentage: z.number(),
  })).optional(),
  priceRanges: z.array(z.object({
    min: z.number(),
    max: z.number(),
    count: z.number(),
    percentage: z.number(),
  })).optional(),
  ratings: z.array(z.object({
    rating: z.number(),
    count: z.number(),
    percentage: z.number(),
  })).optional(),
  tags: z.array(z.object({
    name: z.string(),
    count: z.number(),
    percentage: z.number(),
  })).optional(),
});

// 商品过滤输出Schema
export const FilterItemsOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(ProductItemSchema),
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      totalItems: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
    aggregations: AggregationDataSchema.optional(),
    appliedFilters: z.array(FilterConditionSchema).optional(),
    appliedSort: z.array(SortConditionSchema).optional(),
    searchQuery: z.string().optional(),
    suggestions: z.array(z.string()).optional(),
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
    cacheHit: z.boolean(),
    totalResults: z.number(),
    queryComplexity: z.number(),
  }),
});

export type FilterItemsInput = z.infer<typeof FilterItemsInputSchema>;
export type FilterItemsOutput = z.infer<typeof FilterItemsOutputSchema>;
export type FilterCondition = z.infer<typeof FilterConditionSchema>;
export type SortCondition = z.infer<typeof SortConditionSchema>;
export type ProductItem = z.infer<typeof ProductItemSchema>;

/**
 * 商品过滤工具类
 * 负责根据条件过滤、排序和分页商品数据
 */
export class FilterItemsTool {
  private config = ToolsConfig.itemFilter;
  private cache: Map<string, any> = new Map();
  private database: any; // 数据库连接
  private searchEngine: any; // 搜索引擎连接

  constructor() {
    this.initializeConnections();
  }

  /**
   * 初始化数据库和搜索引擎连接
   */
  private async initializeConnections() {
    try {
      // 初始化数据库连接
      // const { Pool } = require('pg');
      // this.database = new Pool({
      //   connectionString: process.env.DATABASE_URL,
      // });

      // 初始化搜索引擎连接 (Elasticsearch/OpenSearch)
      // const { Client } = require('@opensearch-project/opensearch');
      // this.searchEngine = new Client({
      //   node: process.env.OPENSEARCH_URL,
      // });

      console.log('Database and search engine connections initialized (mock)');
    } catch (error) {
      console.error('Failed to initialize connections:', error);
    }
  }

  /**
   * 执行商品过滤
   */
  async execute(input: FilterItemsInput): Promise<FilterItemsOutput> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // 验证输入
      const validatedInput = FilterItemsInputSchema.parse(input);

      // 检查缓存
      const cacheKey = this.generateCacheKey(validatedInput);
      const cachedResult = this.getCachedResult(cacheKey);
      
      if (cachedResult && this.config.performance.cacheResults) {
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            requestId,
            cacheHit: true,
            processingTime: Date.now() - startTime,
          },
        };
      }

      // 构建查询
      const query = await this.buildQuery(validatedInput);

      // 执行查询
      const results = await this.executeQuery(query, validatedInput);

      // 应用个性化
      const personalizedResults = await this.applyPersonalization(results, validatedInput.userContext);

      // 构建响应
      const response = await this.buildResponse(personalizedResults, validatedInput, requestId, startTime);

      // 缓存结果
      if (this.config.performance.cacheResults) {
        this.setCachedResult(cacheKey, response);
      }

      return response;

    } catch (error) {
      console.error('FilterItemsTool error:', error);

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
          cacheHit: false,
          totalResults: 0,
          queryComplexity: 0,
        },
      };
    }
  }

  /**
   * 构建查询
   */
  private async buildQuery(input: FilterItemsInput): Promise<any> {
    const query: any = {
      bool: {
        must: [],
        filter: [],
        should: [],
        must_not: [],
      },
    };

    // 文本搜索
    if (input.query) {
      query.bool.must.push({
        multi_match: {
          query: input.query,
          fields: ['name^3', 'description^2', 'brand^2', 'category', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // 过滤条件
    if (input.filters) {
      for (const filter of input.filters) {
        const filterClause = this.buildFilterClause(filter);
        if (filterClause) {
          query.bool.filter.push(filterClause);
        }
      }
    }

    // 基本可用性过滤
    if (!input.options?.includeOutOfStock) {
      query.bool.filter.push({ term: { availability: true } });
    }

    if (!input.options?.includeDiscontinued) {
      query.bool.filter.push({ term: { discontinued: false } });
    }

    // 排序
    const sort = this.buildSort(input.sort);

    return {
      query,
      sort,
      size: input.pagination?.pageSize || this.config.pagination.defaultPageSize,
      from: this.calculateOffset(input.pagination),
      _source: input.fields || this.getDefaultFields(),
      aggs: this.buildAggregations(input.aggregations),
    };
  }

  /**
   * 构建过滤子句
   */
  private buildFilterClause(filter: FilterCondition): any {
    const { field, operator, value, values } = filter;

    switch (operator) {
      case 'eq':
        return { term: { [field]: value } };
      
      case 'ne':
        return { bool: { must_not: { term: { [field]: value } } } };
      
      case 'gt':
        return { range: { [field]: { gt: value } } };
      
      case 'gte':
        return { range: { [field]: { gte: value } } };
      
      case 'lt':
        return { range: { [field]: { lt: value } } };
      
      case 'lte':
        return { range: { [field]: { lte: value } } };
      
      case 'in':
        return { terms: { [field]: values || [value] } };
      
      case 'nin':
        return { bool: { must_not: { terms: { [field]: values || [value] } } } };
      
      case 'contains':
        return { wildcard: { [field]: `*${value}*` } };
      
      case 'startsWith':
        return { prefix: { [field]: value } };
      
      case 'endsWith':
        return { wildcard: { [field]: `*${value}` } };
      
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          return { range: { [field]: { gte: value[0], lte: value[1] } } };
        }
        break;
      
      default:
        console.warn(`Unsupported filter operator: ${operator}`);
        return null;
    }
  }

  /**
   * 构建排序
   */
  private buildSort(sortConditions?: SortCondition[]): any[] {
    const sort: any[] = [];

    if (sortConditions && sortConditions.length > 0) {
      // 按优先级排序
      const sortedConditions = sortConditions.sort((a, b) => 
        (a.priority || 999) - (b.priority || 999)
      );

      for (const condition of sortedConditions) {
        sort.push({ [condition.field]: { order: condition.order } });
      }
    } else {
      // 默认排序：相关性 + 流行度
      sort.push({ _score: { order: 'desc' } });
      sort.push({ popularity_score: { order: 'desc' } });
    }

    return sort;
  }

  /**
   * 构建聚合
   */
  private buildAggregations(aggregations?: any): any {
    if (!aggregations) return {};

    const aggs: any = {};

    if (aggregations.categories) {
      aggs.categories = {
        terms: { field: 'category.keyword', size: 20 },
      };
    }

    if (aggregations.brands) {
      aggs.brands = {
        terms: { field: 'brand.keyword', size: 20 },
      };
    }

    if (aggregations.priceRanges) {
      aggs.priceRanges = {
        range: {
          field: 'price',
          ranges: [
            { to: 25 },
            { from: 25, to: 50 },
            { from: 50, to: 100 },
            { from: 100, to: 250 },
            { from: 250, to: 500 },
            { from: 500 },
          ],
        },
      };
    }

    if (aggregations.ratings) {
      aggs.ratings = {
        range: {
          field: 'rating',
          ranges: [
            { from: 4.5 },
            { from: 4.0, to: 4.5 },
            { from: 3.5, to: 4.0 },
            { from: 3.0, to: 3.5 },
            { to: 3.0 },
          ],
        },
      };
    }

    if (aggregations.tags) {
      aggs.tags = {
        terms: { field: 'tags.keyword', size: 30 },
      };
    }

    return aggs;
  }

  /**
   * 执行查询
   */
  private async executeQuery(query: any, input: FilterItemsInput): Promise<any> {
    try {
      // 这里应该执行实际的搜索引擎查询
      // const response = await this.searchEngine.search({
      //   index: 'products',
      //   body: query,
      // });
      // return response.body;

      // 模拟查询结果
      const mockResults = await this.generateMockResults(query, input);
      return mockResults;

    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * 生成模拟结果
   */
  private async generateMockResults(query: any, input: FilterItemsInput): Promise<any> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    const totalItems = 1250;
    const pageSize = input.pagination?.pageSize || 20;
    const page = input.pagination?.page || 1;
    const from = (page - 1) * pageSize;

    // 生成模拟商品
    const items: ProductItem[] = [];
    for (let i = 0; i < Math.min(pageSize, totalItems - from); i++) {
      const id = `product_${from + i + 1}`;
      items.push({
        id,
        name: `Product ${from + i + 1}`,
        description: `Description for product ${from + i + 1}`,
        price: Math.round((Math.random() * 500 + 10) * 100) / 100,
        originalPrice: Math.round((Math.random() * 600 + 50) * 100) / 100,
        discount: Math.round(Math.random() * 30),
        category: ['Electronics', 'Fashion', 'Home', 'Sports'][Math.floor(Math.random() * 4)],
        brand: ['Brand A', 'Brand B', 'Brand C'][Math.floor(Math.random() * 3)],
        images: [`https://example.com/images/${id}.jpg`],
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 500),
        availability: Math.random() > 0.1,
        tags: ['popular', 'new', 'sale'].filter(() => Math.random() > 0.7),
        score: Math.random(),
      });
    }

    // 模拟聚合数据
    const aggregations = {
      categories: {
        buckets: [
          { key: 'Electronics', doc_count: 450 },
          { key: 'Fashion', doc_count: 320 },
          { key: 'Home', doc_count: 280 },
          { key: 'Sports', doc_count: 200 },
        ],
      },
      brands: {
        buckets: [
          { key: 'Brand A', doc_count: 400 },
          { key: 'Brand B', doc_count: 350 },
          { key: 'Brand C', doc_count: 300 },
        ],
      },
    };

    return {
      hits: {
        total: { value: totalItems },
        hits: items.map(item => ({ _source: item, _score: item.score })),
      },
      aggregations,
    };
  }

  /**
   * 应用个性化
   */
  private async applyPersonalization(results: any, userContext?: any): Promise<any> {
    if (!userContext?.userId) {
      return results;
    }

    try {
      // 获取用户偏好
      const userPreferences = await this.getUserPreferences(userContext.userId);

      // 调整商品评分
      for (const hit of results.hits.hits) {
        const item = hit._source;
        let personalizedScore = hit._score || 0;

        // 基于类别偏好调整
        if (userPreferences.categories && userPreferences.categories[item.category]) {
          personalizedScore *= (1 + userPreferences.categories[item.category] * 0.3);
        }

        // 基于品牌偏好调整
        if (userPreferences.brands && userPreferences.brands[item.brand]) {
          personalizedScore *= (1 + userPreferences.brands[item.brand] * 0.2);
        }

        // 基于价格偏好调整
        if (userPreferences.priceRange) {
          const { min, max } = userPreferences.priceRange;
          if (item.price >= min && item.price <= max) {
            personalizedScore *= 1.1;
          }
        }

        hit._score = personalizedScore;
        item.score = personalizedScore;
      }

      // 重新排序
      results.hits.hits.sort((a: any, b: any) => (b._score || 0) - (a._score || 0));

    } catch (error) {
      console.error('Personalization failed:', error);
    }

    return results;
  }

  /**
   * 获取用户偏好
   */
  private async getUserPreferences(userId: string): Promise<any> {
    // 这里应该从数据库或缓存中获取用户偏好
    // const preferences = await this.database.query(
    //   'SELECT preferences FROM user_preferences WHERE user_id = $1',
    //   [userId]
    // );

    // 模拟用户偏好
    return {
      categories: {
        'Electronics': 0.8,
        'Fashion': 0.3,
      },
      brands: {
        'Brand A': 0.6,
        'Brand B': 0.2,
      },
      priceRange: {
        min: 20,
        max: 200,
      },
    };
  }

  /**
   * 构建响应
   */
  private async buildResponse(
    results: any,
    input: FilterItemsInput,
    requestId: string,
    startTime: number
  ): Promise<FilterItemsOutput> {
    const items = results.hits.hits.map((hit: any) => hit._source);
    const totalItems = results.hits.total.value;
    const pageSize = input.pagination?.pageSize || this.config.pagination.defaultPageSize;
    const page = input.pagination?.page || 1;
    const totalPages = Math.ceil(totalItems / pageSize);

    // 处理聚合数据
    const aggregations = this.processAggregations(results.aggregations);

    // 生成搜索建议
    const suggestions = await this.generateSuggestions(input.query, results);

    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        aggregations,
        appliedFilters: input.filters,
        appliedSort: input.sort,
        searchQuery: input.query,
        suggestions,
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        cacheHit: false,
        totalResults: totalItems,
        queryComplexity: this.calculateQueryComplexity(input),
      },
    };
  }

  /**
   * 处理聚合数据
   */
  private processAggregations(aggregations: any): any {
    if (!aggregations) return undefined;

    const processed: any = {};

    if (aggregations.categories) {
      processed.categories = aggregations.categories.buckets.map((bucket: any) => ({
        name: bucket.key,
        count: bucket.doc_count,
        percentage: Math.round((bucket.doc_count / 1250) * 100),
      }));
    }

    if (aggregations.brands) {
      processed.brands = aggregations.brands.buckets.map((bucket: any) => ({
        name: bucket.key,
        count: bucket.doc_count,
        percentage: Math.round((bucket.doc_count / 1250) * 100),
      }));
    }

    return processed;
  }

  /**
   * 生成搜索建议
   */
  private async generateSuggestions(query?: string, results?: any): Promise<string[]> {
    if (!query || results.hits.total.value > 10) {
      return [];
    }

    // 这里可以实现更复杂的建议逻辑
    const suggestions = [
      query.replace(/s$/, ''),
      `${query} accessories`,
      `${query} deals`,
      `popular ${query}`,
    ];

    return suggestions.slice(0, 3);
  }

  /**
   * 计算查询复杂度
   */
  private calculateQueryComplexity(input: FilterItemsInput): number {
    let complexity = 1;

    if (input.query) complexity += 2;
    if (input.filters) complexity += input.filters.length;
    if (input.sort) complexity += input.sort.length;
    if (input.aggregations) complexity += Object.keys(input.aggregations).length;

    return complexity;
  }

  /**
   * 计算偏移量
   */
  private calculateOffset(pagination?: any): number {
    if (pagination?.offset !== undefined) {
      return pagination.offset;
    }

    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || this.config.pagination.defaultPageSize;
    return (page - 1) * pageSize;
  }

  /**
   * 获取默认字段
   */
  private getDefaultFields(): string[] {
    return [
      'id', 'name', 'description', 'price', 'originalPrice', 'discount',
      'category', 'brand', 'images', 'rating', 'reviewCount', 'availability', 'tags'
    ];
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(input: FilterItemsInput): string {
    const key = JSON.stringify({
      query: input.query,
      filters: input.filters,
      sort: input.sort,
      pagination: input.pagination,
      fields: input.fields,
      aggregations: input.aggregations,
    });
    
    // 这里应该使用实际的哈希函数
    return `filter_${key.length}_${Date.now()}`;
  }

  /**
   * 获取缓存结果
   */
  private getCachedResult(key: string): FilterItemsOutput | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.performance.cacheTimeout * 1000) {
      return cached.data;
    }
    return null;
  }

  /**
   * 设置缓存结果
   */
  private setCachedResult(key: string, data: FilterItemsOutput): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // 清理过期缓存
    if (this.cache.size > 1000) {
      const now = Date.now();
      const ttl = this.config.performance.cacheTimeout * 1000;
      
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp > ttl) {
          this.cache.delete(k);
        }
      }
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 快速搜索
   */
  async quickSearch(query: string, options?: { limit?: number; categories?: string[] }): Promise<ProductItem[]> {
    const input: FilterItemsInput = {
      query,
      pagination: { page: 1, pageSize: options?.limit || 10 },
      filters: options?.categories ? [{
        field: 'category',
        operator: 'in',
        value: options.categories[0], // 必需的value属性
        values: options.categories,
      }] : undefined,
    };

    const result = await this.execute(input);
    return result.data?.items || [];
  }

  /**
   * 获取推荐商品
   */
  async getRecommended(userId: string, options?: { limit?: number; category?: string }): Promise<ProductItem[]> {
    const input: FilterItemsInput = {
      userContext: { userId },
      pagination: { page: 1, pageSize: options?.limit || 20 },
      filters: options?.category ? [{
        field: 'category',
        operator: 'eq',
        value: options.category,
      }] : undefined,
      options: {
        includeOutOfStock: false,
        includeDiscontinued: false,
        boostPopular: true,
        boostRecommended: true,
        diversityFactor: 0.4,
        freshnessFactor: 0.1,
      },
    };

    const result = await this.execute(input);
    return result.data?.items || [];
  }

  /**
   * 获取工具状态
   */
  getStatus(): { healthy: boolean; cacheSize: number; connections: any } {
    return {
      healthy: true,
      cacheSize: this.cache.size,
      connections: {
        database: !!this.database,
        searchEngine: !!this.searchEngine,
      },
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.cache.clear();
    
    // 关闭数据库连接
    if (this.database) {
      // this.database.end();
    }
    
    // 关闭搜索引擎连接
    if (this.searchEngine) {
      // this.searchEngine.close();
    }
  }
}

// 创建工具实例
export const filterItemsTool = new FilterItemsTool();