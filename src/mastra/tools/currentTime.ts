import { createTool } from "@mastra/core/tools";

export const currentTimeTool = createTool({
  id: "currentTime",
  description: "Get the current time",
  execute: async () => {
    return new Date().toISOString();
  },
});
