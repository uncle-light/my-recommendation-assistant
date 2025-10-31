import { openai } from "@ai-sdk/openai";
import {
  createVolcengineModel,
  isVolcengineAvailable,
} from "./volcengine-provider";

/**
 * 动态模型配置
 * 支持火山引擎和OpenAI的智能回退机制
 */

// 检查环境变量是否配置
function checkApiKeys() {
  const volcengineKey = process.env.VOLCENGINE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  return {
    hasVolcengine: Boolean(volcengineKey && volcengineKey.trim() !== ""),
    hasOpenAI: Boolean(openaiKey && openaiKey.trim() !== ""),
  };
}

// 创建火山引擎模型实例
function createDefaultVolcengineModel() {
  try {
    // 使用新的OpenAI兼容方式创建火山引擎模型
    const apiKey = process.env.VOLCENGINE_API_KEY;
    if (!apiKey) {
      throw new Error("VOLCENGINE_API_KEY not configured");
    }

    return createVolcengineModel({
      apiKey,
      model: "ep-m-20251024161251-sjljb", // 使用支持的模型名称
    });
  } catch (error) {
    console.warn("Failed to create Volcengine model:", error);
    return null;
  }
}

// 动态选择最佳可用模型
export function getDynamicModel() {
  const { hasVolcengine, hasOpenAI } = checkApiKeys();

  // 优先使用火山引擎
  if (hasVolcengine) {
    const volcengineModel = createDefaultVolcengineModel();
    if (volcengineModel) {
      console.log("🔥 Using Volcengine model for agent");
      return volcengineModel;
    }
  }

  // 回退到OpenAI
  if (hasOpenAI) {
    console.log("🤖 Using OpenAI model for agent (fallback)");
    return openai("ep-m-20251024161251-sjljb");
  }

  // 如果都没有配置，抛出错误
  throw new Error(
    "No valid API keys found. Please configure either VOLCENGINE_API_KEY or OPENAI_API_KEY environment variable."
  );
}

// 获取模型信息
export function getModelInfo() {
  const { hasVolcengine, hasOpenAI } = checkApiKeys();

  return {
    primary: hasVolcengine ? "volcengine" : hasOpenAI ? "openai" : "none",
    fallback: hasVolcengine && hasOpenAI ? "openai" : "none",
    available: {
      volcengine: hasVolcengine,
      openai: hasOpenAI,
    },
  };
}

// 模型配置选项
export interface ModelConfig {
  provider: "volcengine" | "openai";
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

// 预定义的模型配置
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // 火山引擎配置 - 使用OpenAI兼容的标准模型名称
  "volcengine-lite": {
    provider: "volcengine",
    model: "doubao-lite-4k", // 豆包轻量版
    temperature: 0.7,
    maxTokens: 4000,
  },
  "volcengine-pro": {
    provider: "volcengine",
    model: "ep-m-20251024161251-sjljb", // 豆包专业版
    temperature: 0.7,
    maxTokens: 8000,
  },
  "volcengine-pro-32k": {
    provider: "volcengine",
    model: "doubao-pro-32k", // 豆包专业版长上下文
    temperature: 0.7,
    maxTokens: 32000,
  },

  // OpenAI配置
  "openai-gpt4": {
    provider: "openai",
    model: "ep-m-20251024161251-sjljb",
    temperature: 0.7,
    maxTokens: 4000,
  },
  "openai-gpt4-turbo": {
    provider: "openai",
    model: "ep-m-20251024161251-sjljb-turbo-preview",
    temperature: 0.7,
    maxTokens: 8000,
  },
};

// 根据配置创建模型实例
export function createModelFromConfig(configName: string) {
  const config = MODEL_CONFIGS[configName];
  if (!config) {
    throw new Error(`Unknown model config: ${configName}`);
  }

  const { hasVolcengine, hasOpenAI } = checkApiKeys();

  if (config.provider === "volcengine") {
    if (!hasVolcengine) {
      if (hasOpenAI) {
        console.warn(`Volcengine not available, falling back to OpenAI`);
        return openai("ep-m-20251024161251-sjljb");
      }
      throw new Error("Volcengine API key not configured");
    }

    // 使用指定的模型配置创建火山引擎模型
    try {
      const volcengineModel = createVolcengineModel({
        apiKey: process.env.VOLCENGINE_API_KEY!,
        model: config.model,
      });
      return volcengineModel;
    } catch (error) {
      if (hasOpenAI) {
        console.warn(
          `Failed to create Volcengine model, falling back to OpenAI:`,
          error
        );
        return openai("ep-m-20251024161251-sjljb");
      }
      throw new Error(
        "Failed to create Volcengine model and no OpenAI fallback"
      );
    }
  } else {
    if (!hasOpenAI) {
      if (hasVolcengine) {
        console.warn(`OpenAI not available, falling back to Volcengine`);
        const volcengineModel = createDefaultVolcengineModel();
        if (volcengineModel) {
          return volcengineModel;
        }
      }
      throw new Error("OpenAI API key not configured");
    }

    return openai(config.model);
  }
}

// 注意：不要在模块级别调用getDynamicModel()，因为它需要API密钥
// 如需默认模型，请在运行时调用getDynamicModel()
