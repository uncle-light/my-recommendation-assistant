import {
  createVectorQueryTool,
  MastraAgentRelevanceScorer,
  rerank,
} from "@mastra/rag";
import { volcengine } from "../providers/volcengine";
import { createTool } from "@mastra/core/tools";
import z from "zod";

import { queryVectors, embedQuery } from "../rga/product";
import { deepseek } from "../providers/deepseek";
export const baseSchema = {
  queryText: z.string()
    .describe(`The text query to search for in the vector database.
- ALWAYS provide a non-empty query string
- Must contain the user's question or search terms
- Example: "market data" or "financial reports"
- If the user's query is about a specific topic, use that topic as the queryText
- Cannot be an empty string
- Do not include quotes, just the text itself
- Required for all searches`),
  topK: z.coerce.number()
    .describe(`Controls how many matching documents to return.
- ALWAYS provide a value
- If no value is provided, use the default (10)
- Must be a valid and positive number
- Cannot be NaN
- Uses provided value if specified
- Default: 10 results (use this if unsure)
- Higher values (like 20) provide more context
- Lower values (like 3) focus on best matches
- Based on query requirements`),
};
export const vectorQueryTool = createTool({
  id: "vectorQueryTool",
  description:
    "Access the knowledge base to find information needed to answer user questions.",
  inputSchema: z.object(baseSchema),
  outputSchema: z.object({
    // Array of metadata or content for compatibility with prior usage
    relevantContext: z.any(),
    // Array of full retrieval result objects
    sources: z.array(
      z.object({
        id: z.string(), // Unique chunk/document identifier
        metadata: z.any(), // All metadata fields (document ID, etc.)
        vector: z.array(z.number()), // Embedding vector (if available)
        score: z.number(), // Similarity score for this retrieval
        document: z.string(), // Full chunk/document text (if available)
      })
    ),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("workflow info log", context);
    console.log(context);
    const topK: number = context?.topK ?? 10;
    const queryText = context?.queryText;
    const embed = await embedQuery(queryText);
    const result = await queryVectors(embed, topK);
    const rerankedResults = await rerank(
      result,
      queryText,
      deepseek("deepseek-chat"),
      {
        weights: {
          semantic: 0.5, // How well the content matches the query semantically
          vector: 0.3, // Original vector similarity score
          position: 0.2, // Preserves original result ordering
        },
        topK: 3,
      }
    );
    console.log(rerankedResults);
    return rerankedResults.map((item) => item.result) as any;
  },
});
