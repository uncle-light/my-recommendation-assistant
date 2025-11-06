import { MDocument } from "@mastra/rag";
import { embed, embedMany } from "ai";
import { volcengine } from "../providers/volcengine";
import { pgVector } from "../../database/pgVector";
import { deepseek } from "../providers/deepseek";
import fs from "fs";
import path from "path";

/**
 * 通用：分块 + 摘要 + 关键词提取
 */
async function processDocument(text: string) {
  const doc = MDocument.fromText(text);
  const chunks = await doc.chunk({
    strategy: "recursive",
    separators: ["\n"],
    maxSize: 800,
    overlap: 50,
    stripWhitespace: true,
    extract: {
      summary: {
        llm: deepseek("deepseek-chat"),
        promptTemplate: "请用一句话总结以下内容：{context}",
      },
      keywords: {
        llm: deepseek("deepseek-chat"),
        keywords: 5,
        promptTemplate: "提取{maxKeywords}个关键词：{context}",
      },
    },
  });
  return chunks;
}

/**
 * 通用：向量化一批文本
 */
async function embedTexts(texts: string[]) {
  console.log(texts);

  const { embeddings } = await embedMany({
    model: volcengine.embedding("ep-20251016153453-g2d58"),
    values: texts,
    maxRetries: 2,
  });
  console.log(embeddings);

  return embeddings;
}

/**
 * 通用：向量化查询文本
 */
async function embedQuery(query: string) {
  const { embedding } = await embed({
    model: volcengine.embedding("ep-20251016153453-g2d58"),
    value: query,
  });
  return embedding;
}

/**
 * 向量数据库操作封装
 */
const INDEX_NAME = "product_embedding";
const DIMENSION = 1024;

async function createIndex() {
  await pgVector.createIndex({
    indexName: INDEX_NAME,
    dimension: DIMENSION,
    metric: "cosine",
    indexConfig: {
      type: "hnsw",
      hnsw: { m: 16, efConstruction: 64 },
    },
  });
}

async function upsertVectors(embeddings: number[][], chunks: any[]) {
  await pgVector.upsert({
    indexName: INDEX_NAME,
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({
      text: chunk.text,
      summary: chunk.summary,
      keywords: chunk.keywords,
    })),
  });
}

async function queryVectors(queryVector: number[], topK = 10) {
  const result = await pgVector.query({
    indexName: INDEX_NAME,
    queryVector,
    topK,
  });
  return result;
}

/**
 * 主函数：构建索引并执行查询
 */
async function main() {
  try {
    // 1️⃣ 读取文件
    const cvsPath = path.join(__dirname, "./data/product.csv");
    const cvs = fs.readFileSync(cvsPath, "utf-8");
    const cvsText = cvs.split("\n").join("\n");

    console.log("📄 已读取产品文件，开始分块处理...");

    // 2️⃣ 文档分块 + 摘要提取
    const chunks = await processDocument(cvsText);
    console.log(`✅ 已生成 ${chunks.length} 个片段`);
    console.log(chunks.map((c) => c.text));
    // 3️⃣ 向量化
    const embeddings = await embedTexts(chunks.map((c) => c.text));
    console.log("✅ 向量化完成");

    // 4️⃣ 创建索引 + Upsert
    await createIndex();
    await upsertVectors(embeddings, chunks);
    console.log("✅ 向量索引与插入完成");

    // 5️⃣ 查询示例
    const query = "什么是阿司匹林";
    const queryVector = await embedQuery(query);
    const result = await queryVectors(queryVector, 10);

    console.log(`🔍 查询：「${query}」`);
    console.log(result);
  } catch (err) {
    console.error("❌ 处理过程出现错误：", err);
  }
}

main();
