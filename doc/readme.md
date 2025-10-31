

# 技术方案：导购助手长期记忆 + 推荐系统

## 1. 背景 &目标

* 目标：构建一个智能导购助手系统，使用户与平台的交互更加个性化、基于长期记忆（用户历史偏好、行为、交互）＋实时推荐。
* 核心价值点：

  * 用户在多次会话／浏览中，系统能“记住”其偏好、历史行为，从而提升推荐精准度与用户黏性。
  * 推荐系统不仅基于当前行为，还基于长期记忆与语义检索（如类似用户、类似历史）做决策。
  * 系统采用 Mastra 作为 Agent/Workflow 框架，结合向量数据库（如 Qdrant）做长期记忆存储。
* 适用场景：你有 3000 款商品、小规模推荐起步；长期规划可扩展至更多商品／更多用户交互。

---

## 2. 技术架构概览

* 前端 UI 层（React／Next.js + TypeScript）用于用户对话／推荐展示。
* API 层／Backend（Node.js + Mastra）管理用户请求、Agent 调用、Workflow 执行。
* 存储层：

  * 向量数据库（Qdrant）用于存放用户长期记忆 embedding +商品 embedding。
  * 结构化数据库（PostgreSQL／MongoDB）用于用户静态属性、行为日志、推荐反馈。
* Mastra 模块：Agent 层、Workflow 层、Tools 层、Memory 模块。
* 运维监控层：负责资源监控（RAM、CPU、IO）、推荐效果监控（点击率、转化率）、记忆召回率、系统日志。

---

## 3. 模块划分

### 3.1 Agent 层

* **ShoppingAssistantAgent**：用户交互入口。负责解析用户意图、决定是否调用推荐或对话形式响应、输出回复 + 推荐。
* **RecommendationAgent**：负责推荐逻辑。接收用户 ID、当前意图、记忆上下文 +筛选条件 → 输出推荐商品 ID 列表 +理由。
* **LongTermMemoryAgent**：读取／写入用户长期记忆。负责从向量库检索相关记忆、将新交互写入记忆库。

### 3.2 Workflow 层

* **SessionWorkflow**：用户发起对话流程。步骤：解析意图 → 检索记忆 → 生成推荐 → 响应用户 → 更新记忆。
* **RecommendationWorkflow**：在非对话触发（如用户浏览、活动触发）情况下执行推荐流程。
* **MemoryUpdateWorkflow**：当用户完成关键行为（购买、反馈）时触发写入记忆流程。

### 3.3 Tools 层

* **getProductDetailsTool**：根据商品 ID 获取品牌／类别／价格／库存等元数据。
* **vectorDBQueryTool**：向量数据库查询 tool（给定 query vector + filter → 返回最近记忆／商品 embedding）。
* **logUserActionTool**：记录用户行为（点击、浏览、购买、反馈）到行为日志系统。
* **filterItemsTool**：基于类别、价格区间、品牌、库存状态对商品池做筛选。

### 3.4 Memory 模块

* **短期记忆**：当前会话中的上下文、用户输入、推荐历史等，用于当次会话优化。
* **长期记忆**：用户跨会话的偏好、历史交互 embedding +metadata；存于向量数据库 +结构化数据库。
* 支持语义召回（Semantic Recall）：利用 embedding 查询相关记忆片段，提高推荐／对话上下文质量。

---

## 4. 数据模型 &存储方案

### 4.1 向量数据库（Qdrant）

* 为长期记忆建立一个 collection，如 `user_memory`，向量维度例如 768。支持距离度量 Cosine 或 Dot。 ([Qdrant][1])
* 插入向量结构：`{ id: <memory_id>, vector: [float…], metadata: { userId: string, type: string, timestamp: number, tags: [...] } }`
* 查询接口：以 query vector + filter (如 userId=xxx, timestamp>…) → 返回 top K 相关记忆。

### 4.2 结构化存储

* 用户表（User）：`userId, registrationDate, membershipLevel, staticAttributes…`
* 偏好表（UserPreference）：`userId, categoryCounts, brandCounts, updatedAt…`
* 行为日志表（UserActionLog）：`logId, userId, actionType (browse/click/purchase), itemId, timestamp, metadata…`
* 推荐反馈表（RecommendationFeedback）：`feedbackId, userId, itemId, recommendationId, clicked(Boolean), purchased(Boolean), timestamp`

---

## 5. 流程实现

### 5.1 用户发起会话流程（SessionWorkflow）

1. 接收输入：`{ userId, message }`
2. ShoppingAssistantAgent 解析意图（intent, maybe filterParams）
3. LongTermMemoryAgent 查询：读取该 userId 的最近记忆片段 → 得到 memoryContext
4. RecommendationAgent 输入：userId + intent + memoryContext + filterParams → 输出推荐 itemIds + reasons
5. ShoppingAssistantAgent 响应用户：`replyText` + 展示推荐
6. 当用户反馈（如选中推荐、购买）触发 MemoryUpdateWorkflow 写入新记忆。

### 5.2 推荐触发流程（RecommendationWorkflow）

* 触发条件：用户浏览新商品／活动弹窗／品牌专题页进入
* 步骤：读取 memory →推荐 agent →日志记录 →响应 UI。

### 5.3 记忆更新流程（MemoryUpdateWorkflow）

* 输入：`userId, memoryData`（embedding + metadata）
* 步骤：生成 embedding（可调用 embedding 模型）→ LongTermMemoryAgent 写入 → 若为热数据则标记为热、否则归档为冷数据。
* 同时更新结构化偏好表（如品牌计数、类别计数）。

---

## 6. 推荐系统设计要点

* 商品 embedding：为每款商品预先生成 embedding（可能包括标题、描述、图像特征）并存入向量库。
* 用户偏好 embedding：可基于长期记忆 embedding 的聚合或最近行为 embedding。
* 推荐逻辑：

  * 初步候选池：基于用户静态偏好 +最近行为 +筛选条件 filterItemsTool。
  * 精排：计算用户 embedding 与商品 embedding 的相似度 → 加权结合“长期记忆得分”“最近行为得分”“冷新商品探索得分”。
  * 输出 top N 推荐。
* 反馈闭环：对推荐结果进行点击／购买监测 → 写入 RecommendationFeedback 表 →可用于后续模型精调。

---

## 7. 热／冷数据策略 &容量规划

* 热数据：如最近 3 ～ 6 个月内的记忆片段、用户活跃期行为 → 存放在 RAM 优化的向量集合。
* 冷数据：6 个月以上或用户低活跃期 → 可转为 On-Disk 存储或归档。向量库支持 On-Disk 模式减少 RAM 负担。 ([Qdrant][1])
* 容量规划示例（假设用户交互体量增长）可参考前面向量条数 ×维度 ×4 bytes ×1.5 公式。
* 定期监控：当向量条数／内存使用率超过阈值（如 RAM 使用 >70%），应触发分片或扩展节点。

---

## 8. 安全、隐私、合规考虑

* 用户敏感信息脱敏：在记忆 metadata 中避免存储身份证号、支付卡号等敏感字段。
* 数据访问控制：推荐系统／Agent 访问用户记忆需权限控制。
* 模型可解释性：推荐 Agent 输出时附带推荐理由（reasons）以增强透明度。
* 数据生命周期管理：对长期记忆设置 TTL（例如 24 月后归档／删除）并记录删除日志。

---

## 9. 运营指标 &监控

* 推荐点击率 (CTR)、推荐转化率 (CVR)
* 记忆召回率：调用记忆成功并被推荐系统使用比例
* 会话平均长度、复购率、用户粘性
* 系统性能指标：向量检索延迟、推荐响应延迟、RAM/CPU/IO 使用率、错误率
* 定期评估：使用 Mastra 的 eval 功能对 Agent 输出进行质量监控。 ([GitHub][2])

---

## 10. 开发与部署流程

* 使用 CLI：`npx create-mastra@latest` 初始化项目。 ([WorkOS][3])
* 目录结构如前所述（agents, workflows, tools, memory）
* 本地开发：在 `.env` 中配置 LLM API key、向量数据库连接、结构化数据库连接
* CI/CD：部署至云端或容器；配置 autoscaling、分片机制、监控告警
* 版本管理：Agent／Workflow 更新需配置迁移脚本（如 memory schema 变更）
* 多租户支持：不同客户（品牌）可在 memory metadata 中带 `brandId` 字段，并在工具/Agent中分品牌逻辑。
