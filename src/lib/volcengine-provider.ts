import { createOpenAI } from "@ai-sdk/openai";

/**
 * 火山引擎豆包模型配置
 */
export interface VolcengineConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

/**
 * 火山引擎支持的模型列表
 */
export const VOLCENGINE_MODELS = {
  // 豆包主力模型
  "ep-m-20251024161251-sjljb": "ep-m-20251024161251-sjljb",
  "doubao-pro-32k": "doubao-pro-32k",
  "doubao-pro-128k": "doubao-pro-128k",
  "doubao-lite-4k": "doubao-lite-4k",
  "doubao-lite-32k": "doubao-lite-32k",
  "doubao-lite-128k": "doubao-lite-128k",

  // 通用模型别名
  "doubao-pro": "ep-m-20251024161251-sjljb",
  "doubao-lite": "doubao-lite-4k",
} as const;

export type VolcengineModelId = keyof typeof VOLCENGINE_MODELS;

/**
 * 创建火山引擎语言模型
 * 使用OpenAI SDK兼容接口，只需修改baseURL和model
 */
export function createVolcengineModel(config: VolcengineConfig) {
  const {
    apiKey,
    baseURL = "https://ark.cn-beijing.volces.com/api/v3",
    model = "ep-m-20251024161251-sjljb",
  } = config;

  // 验证API密钥
  if (!apiKey) {
    throw new Error("Volcengine API key is required");
  }

  // 获取实际的模型ID
  const actualModelId = VOLCENGINE_MODELS[model as VolcengineModelId] || model;

  // 使用createOpenAI创建兼容的provider
  // 火山引擎API兼容OpenAI格式，只需要修改baseURL
  const volcengineProvider = createOpenAI({
    apiKey,
    baseURL,
  });

  // 返回指定模型
  return volcengineProvider(actualModelId);
}

/**
 * 便捷函数：使用环境变量创建火山引擎模型
 */
export function createVolcengineModelFromEnv(modelName?: string) {
  const apiKey = process.env.VOLCENGINE_API_KEY;

  if (!apiKey) {
    throw new Error("VOLCENGINE_API_KEY environment variable is required");
  }

  return createVolcengineModel({
    apiKey,
    model: modelName || "ep-m-20251024161251-sjljb",
  });
}

/**
 * 检查火山引擎API密钥是否可用
 */
export function isVolcengineAvailable(): boolean {
  return !!process.env.VOLCENGINE_API_KEY;
}

/**
 * 获取推荐的火山引擎模型配置
 */
export function getRecommendedVolcengineModel(): string {
  return "ep-m-20251024161251-sjljb"; // 平衡性能和成本的推荐模型
}

/**
 * 获取所有可用的火山引擎模型
 */
export function getAvailableVolcengineModels(): string[] {
  return Object.keys(VOLCENGINE_MODELS);
}
