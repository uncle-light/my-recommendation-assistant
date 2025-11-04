import { createDeepSeek } from "@ai-sdk/deepseek";

export const volcengine = createDeepSeek({
  apiKey: process.env.VOLCENGINE_API_KEY || "",
  baseURL:
    process.env.VOLCENGINE_BASE_URL ||
    "https://ark.cn-beijing.volces.com/api/v3",
});
