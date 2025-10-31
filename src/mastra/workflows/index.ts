// {{RIPER-5:
//   Action: "Modified"
//   Task_ID: "migrate-memory-workflows"
//   Timestamp: "2025-01-27T11:20:00Z"
//   Authoring_Role: "LD"
//   Principle_Applied: "SOLID-S (单一职责原则)"
//   Quality_Check: "更新工作流索引以使用新的Mastra记忆工作流"
// }}
// {{START_MODIFICATIONS}}

// 导入所有工作流
import { sessionWorkflow } from './session-workflow';
import { recommendationWorkflow } from './recommendation-workflow';
import { memoryWorkflowNew } from './memory-workflow-new';

// 导出所有工作流
export { sessionWorkflow } from './session-workflow';
export { recommendationWorkflow } from './recommendation-workflow';
export { applianceWorkflow } from './appliance-workflow';
export { memoryWorkflowNew } from './memory-workflow-new';

// 导出工作流类型
export type {
  SessionWorkflowInput,
  SessionWorkflowOutput,
} from './session-workflow';

export type {
  RecommendationWorkflowInput,
  RecommendationWorkflowOutput,
} from './recommendation-workflow';

export type {
  MemoryWorkflowNewInput,
  MemoryWorkflowNewOutput,
} from './memory-workflow-new';

// 工作流集合
export const workflows = {
  sessionWorkflow,
  recommendationWorkflow,
  memoryWorkflow: memoryWorkflowNew,
};

// {{END_MODIFICATIONS}}