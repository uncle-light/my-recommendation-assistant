import { Mastra } from "@mastra/core";
import {} from "@mastra/pg";
import { PinoLogger } from "@mastra/loggers";

import { applianceAgent } from "./agents";
import { SamplingStrategyType } from "@mastra/core/ai-tracing";
import { postgres } from "../database/postgres";

export const mastra = new Mastra({
  agents: {
    applianceAgent,
  },
  storage: postgres,
  logger: new PinoLogger({
    level: "debug",
  }),

  observability: {
    configs: {
      default: {
        serviceName: "mastra",
        sampling: {
          type: SamplingStrategyType.ALWAYS,
        },
      },
    },
  },
  telemetry: {
    enabled: true, // Enables OTEL Tracing
  },
});

// 导出所有模块
export * from "./agents";
export * from "./memory";
