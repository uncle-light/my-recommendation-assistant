import { Mastra } from "@mastra/core/mastra";
import {} from "@mastra/pg";
import { PinoLogger } from "@mastra/loggers";

import { applianceAgent, bayerAgent } from "./agents";
import { SamplingStrategyType } from "@mastra/core/ai-tracing";
import { postgres } from "../database/postgres";
import { pgVector } from "../database/pgVector";

export const mastra = new Mastra({
  agents: {
    applianceAgent,
    bayerAgent,
  },
  storage: postgres,
  logger: new PinoLogger({
    level: "error",
  }),
  vectors: { pgVector },
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
