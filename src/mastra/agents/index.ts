// {{RIPER-5:
//   Action: "Modified"
//   Task_ID: "implement-memory-agents"
//   Timestamp: "2025-01-27T10:55:00Z"
//   Authoring_Role: "LD"
//   Principle_Applied: "SOLID-S (单一职责原则)"
//   Quality_Check: "使用Mastra原生记忆系统重新实现代理集合"
// }}
// {{START_MODIFICATIONS}}

// 导入代理
import { applianceAgent } from "./appliance-agent-new";

// 导出推荐代理

// 导出新的家电代理
export {
  applianceAgent,
  queryApplianceAgent,
  searchAppliances,
  compareAppliances,
  recommendAppliances,
} from "./appliance-agent-new";
export type {
  ApplianceAgentInput,
  ApplianceAgentOutput,
} from "./appliance-agent-new";

// 集合所有Agent
export const agents = {
  applianceAgent,
};

// {{END_MODIFICATIONS}}
