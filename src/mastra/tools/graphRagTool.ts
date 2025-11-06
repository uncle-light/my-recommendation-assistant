import { createVectorQueryTool } from "@mastra/rag";
import { volcengine } from "../providers/volcengine";

export const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: "pgVector",
  indexName: "product_embedding",
  model: volcengine.embedding("ep-20251024101345-l48bt"),
});
