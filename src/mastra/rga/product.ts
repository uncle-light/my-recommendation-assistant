import { MDocument } from "@mastra/rag";
import { embed, embedMany } from "ai";
import { volcengine } from "../providers/volcengine";
import { pgVector } from "../../database/pgVector";
import { deepseek } from "../providers/deepseek";
import fs from "fs";
import path from "path";
import { v4 } from "uuid";

/**
 * 步骤 1: 降维 - 截取前 dim 维度
 */
function reduceDimension(vector: number[], dim: number): number[] {
  return vector.slice(0, dim);
}

/**
 * 步骤 2: 计算余弦相似度
 * 公式: cosine_similarity = (A · B) / (||A|| × ||B||)
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error(`向量维度不匹配: ${vec1.length} vs ${vec2.length}`);
  }

  // 计算点积 A · B
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }

  // 计算范数
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  // 避免除零
  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * 通用：分块 + 摘要 + 关键词提取
 */
async function processDocument(text: string) {
  const docId = v4();
  const doc = MDocument.fromText(text, {
    docId,
  });
  const chunks = await doc.chunk({
    strategy: "recursive",
    separators: ["\n"],
    maxSize: 512,
    overlap: 50,
    stripWhitespace: true,
    extract: {
      title: {
        llm: deepseek("deepseek-chat"),
      },
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
  const metadata = doc.getMetadata();
  return chunks;
}

/**
 * 通用：向量化一批文本（批量处理）
 * 返回降维后的向量数组
 */
async function embedTexts(
  texts: string[],
  targetDim: number = 1024
): Promise<number[][]> {
  console.log(`📊 正在向量化 ${texts.length} 个文本片段...`);

  const { embeddings } = await embedMany({
    model: volcengine.embedding("ep-20251016153453-g2d58"),
    values: texts,
    maxRetries: 2,
  });

  // 对每个向量进行降维处理（只截取，不归一化）
  const reducedEmbeddings = embeddings.map((embedding) =>
    reduceDimension(embedding, targetDim)
  );

  return reducedEmbeddings;
}

/**
 * 通用：向量化查询文本（单个）
 * 返回降维后的向量
 */
export async function embedQuery(
  query: string,
  targetDim: number = 1024
): Promise<number[]> {
  const { embedding } = await embed({
    model: volcengine.embedding("ep-20251016153453-g2d58"),
    value: query,
  });

  // 降维处理（只截取，不归一化）
  return reduceDimension(embedding, targetDim);
}

/**
 * 向量数据库操作封装
 */
const INDEX_NAME = "product_embedding";
const DIMENSION = 1024; // ⚠️ HNSW 索引最大支持 2000 维，使用 1024 维平衡性能和精度

async function dropIndexIfExists() {
  try {
    await pgVector.deleteIndex({ indexName: INDEX_NAME });
    console.log(`🗑️  已删除旧索引: ${INDEX_NAME}`);
  } catch (err) {
    console.log("ℹ️  索引不存在，跳过删除");
  }
}

async function createIndex() {
  console.log(`🔍 准备创建索引，维度: ${DIMENSION}`);

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
  pgVector.updateVector;
  await pgVector.upsert({
    indexName: INDEX_NAME,
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({
      text: chunk.text,
      summary: chunk.metadata.sectionSummary,
      keywords: chunk.metadata.excerptKeywords,
    })),
  });
}

export async function queryVectors(queryVector: number[], topK = 10) {
  const result = await pgVector.query({
    indexName: INDEX_NAME,
    queryVector,
    topK,
  });
  return result;
}

/**
 * 测试不同维度的相似度（可选）
 */
async function testDimensionSimilarity(embeddings: number[][]) {
  const dimensions = [512, 1024, 2048];
  console.log("\n📐 测试不同维度的相似度：");
  for (const dim of dimensions) {
    // 降维
    const reduced1 = reduceDimension(embeddings[0], dim);
    const reduced2 = reduceDimension(embeddings[1], dim);

    // 计算相似度
    const similarity = cosineSimilarity(reduced1, reduced2);

    console.log(
      `${dim.toString().padStart(4)} 维相似度: ${similarity.toFixed(6)}`
    );
  }
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

    // 3️⃣ 向量化（批量处理所有片段，降维到 1024 维）
    const embeddings = await embedTexts(
      chunks.map((c) => c.text),
      1024 // 目标维度
    );
    console.log(`✅ 向量化完成，维度: ${embeddings[0]?.length}`);
    console.log(`✅ 向量数量: ${embeddings.length}`);

    // 可选：测试不同维度的相似度
    if (embeddings.length >= 2) {
      await testDimensionSimilarity(embeddings);
    }

    // 4️⃣ 删除旧索引 + 创建新索引 + Upsert
    await dropIndexIfExists();
    await createIndex();
    console.log(`✅ 创建索引完成，维度: ${DIMENSION}`);

    await upsertVectors(embeddings, chunks);
    console.log("✅ 向量插入完成");

    // 5️⃣ 查询示例
    const query = "什么是阿司匹林";
    const queryVector = await embedQuery(query, 1024); // 查询向量也要降维到相同维度
    const result = await queryVectors(queryVector, 10);
    console.log(`\n🔍 查询：「${query}」`);
    console.log("📋 查询结果：");
    result.forEach((item, index) => {
      console.log(`\n${index + 1}. 相似度: ${item.score?.toFixed(4)}`);
      console.log(`   文本: ${item.metadata?.text?.substring(0, 100)}...`);
      console.log(`   摘要: ${item.metadata?.summary}`);
      console.log(`   关键词: ${item.metadata?.keywords}`);
    });
  } catch (err) {
    console.error("❌ 处理过程出现错误：", err);
  }
}

main();
