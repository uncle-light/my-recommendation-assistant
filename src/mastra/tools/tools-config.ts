// 简化的工具配置 - 适配Mastra原生记忆系统

export const ToolsConfig = {
  // 商品详情工具配置
  productDetails: {
    // API配置
    api: {
      baseUrl: process.env.PRODUCT_API_BASE_URL || 'https://api.example.com',
      timeout: 5000,
      retries: 3,
    },
    // 缓存配置
    cache: {
      enabled: true,
      ttl: 300, // 5分钟
      maxSize: 1000,
      keyPrefix: 'product_details_',
    },
    // 字段映射配置
    fieldMapping: {
      id: 'product_id',
      name: 'title',
      description: 'description',
      price: 'price',
      category: 'category',
      brand: 'brand',
      images: 'image_urls',
      rating: 'average_rating',
      availability: 'in_stock',
      reviews: 'reviews',
      specifications: 'specs',
      tags: 'tags',
    },
    // 默认字段
    defaultFields: [
      'id', 'name', 'description', 'price', 'category', 'brand', 
      'images', 'rating', 'availability'
    ],
  },

  // 商品筛选工具配置
  itemFilter: {
    // 筛选器配置
    filters: {
      price: {
        type: 'range',
        min: 0,
        max: 999999,
        step: 0.01,
        currency: 'CNY',
      },
      category: {
        type: 'multi_select',
        options: [
          '电子产品', '家用电器', '服装', '家居用品', '运动户外',
          '美妆护肤', '汽车用品', '健康保健', '玩具'
        ],
        maxSelections: 5,
      },
      brand: {
        type: 'multi_select',
        maxSelections: 10,
        searchable: true,
      },
      rating: {
        type: 'range',
        min: 0,
        max: 5,
        step: 0.1,
      },
      availability: {
        type: 'boolean',
        default: true,
      },
    },
    // 排序配置
    sorting: {
      options: [
        { key: 'relevance', label: '相关性', default: true },
        { key: 'price_asc', label: '价格从低到高' },
        { key: 'price_desc', label: '价格从高到低' },
        { key: 'rating_desc', label: '评分最高' },
        { key: 'newest', label: '最新上架' },
        { key: 'popularity', label: '最受欢迎' },
      ],
    },
    // 分页配置
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 100,
      allowedPageSizes: [10, 20, 50, 100],
    },
    // 性能配置
    performance: {
      cacheResults: true,
      cacheTimeout: 300000, // 5分钟
      maxCacheSize: 1000,
    },
  },

  // 向量数据库配置
  vectorDB: {
    enabled: false, // 使用Mastra原生记忆系统
    provider: 'mastra-memory',
    config: {
      dimensions: 1536,
      metric: 'cosine',
      indexType: 'hnsw',
    },
    pinecone: {
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
      indexName: 'recommendation-index',
    },
  },

  // 用户行为配置
  userAction: {
    tracking: {
      enabled: true,
      events: ['view', 'click', 'purchase', 'favorite', 'compare'],
      batchSize: 100,
      flushInterval: 5000,
    },
    analytics: {
      enabled: true,
      retentionDays: 90,
      aggregationInterval: 3600, // 1小时
    },
    actionTypes: {
      VIEW: 'view',
      CLICK: 'click',
      PURCHASE: 'purchase',
      FAVORITE: 'favorite',
      COMPARE: 'compare',
      SEARCH: 'search',
    },
  },

  // 通用配置
  common: {
    // 错误处理
    errorHandling: {
      retryAttempts: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      maxRetryDelay: 10000,
    },
    // 监控配置
    monitoring: {
      enabled: true,
      metricsInterval: 60000, // 1分钟
      logLevel: 'info',
      trackPerformance: true,
    },
    // 安全配置
    security: {
      validateInput: true,
      sanitizeOutput: true,
      rateLimiting: true,
      requireAuth: false, // 简化为不需要认证
    },
  },
};

// 简化的工具类型定义
export type ToolType = 'productDetails' | 'itemFilter';

// 工具状态定义
export type ToolStatus = 'active' | 'inactive' | 'maintenance' | 'error';

// 工具元数据接口
export interface ToolMetadata {
  name: string;
  version: string;
  description: string;
  type: ToolType;
  status: ToolStatus;
  lastUpdated: string;
  dependencies: string[];
  permissions: string[];
}

// 简化的工具注册表
export const ToolRegistry: Record<string, ToolMetadata> = {
  getProductDetailsTool: {
    name: 'Get Product Details Tool',
    version: '2.0.0',
    description: 'Retrieves detailed information about products',
    type: 'productDetails',
    status: 'active',
    lastUpdated: new Date().toISOString(),
    dependencies: ['product-api'],
    permissions: ['read:products'],
  },
  filterItemsTool: {
    name: 'Filter Items Tool',
    version: '2.0.0',
    description: 'Filters and sorts product listings based on criteria',
    type: 'itemFilter',
    status: 'active',
    lastUpdated: new Date().toISOString(),
    dependencies: ['mastra-memory'],
    permissions: ['read:products'],
  },
};

export default ToolsConfig;