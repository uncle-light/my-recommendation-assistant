# 智能推荐助手系统

基于Mastra框架构建的智能推荐助手系统，集成了火山引擎豆包大模型，提供强大的中文语义理解和推荐能力。

## 🚀 主要特性

- **智能推荐**: 基于用户行为和偏好的个性化推荐
- **语义理解**: 集成火山引擎豆包模型，优秀的中文理解能力
- **记忆系统**: 基于PostgreSQL的持久化记忆存储
- **多代理架构**: 推荐代理和家电代理协同工作
- **工作流引擎**: 支持复杂的记忆管理工作流
- **实时对话**: 流式响应和实时交互体验

## 🛠️ 技术栈

- **框架**: Mastra AI Framework v0.1.x
- **语言**: TypeScript/Node.js
- **AI模型**: 火山引擎豆包系列模型 (ep-m-20251024161251-sjljb)
- **数据库**: PostgreSQL (记忆存储)
- **API**: RESTful API with Swagger UI
- **前端**: Mastra Playground

## 📦 安装和配置

### 1. 克隆项目
```bash
git clone <repository-url>
cd my-recommendation-assistant
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
复制环境变量模板并配置：
```bash
cp .env.example .env
```

编辑`.env`文件，配置必要的API密钥：
```env
# 火山引擎ARK API配置
ARK_API_KEY=your_volcengine_api_key_here

# OpenAI API配置（备用）
OPENAI_API_KEY=your-openai-api-key

# PostgreSQL数据库配置
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# 服务器配置
PORT=3000
```

### 4. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## 🔥 火山引擎集成与动态模型选择

本系统集成了火山引擎的豆包大模型，并实现了智能的动态模型选择机制，提供优秀的中文语义理解能力和高可用性。

### 动态模型选择机制

系统实现了智能的模型选择和回退机制：

- **优先级**: 火山引擎 > OpenAI
- **自动检测**: 检查环境变量中的API密钥配置
- **智能回退**: 当主要提供商不可用时，自动切换到备用提供商
- **统一接口**: 所有Agent使用统一的`getDynamicModel()`接口

```typescript
import { getDynamicModel } from './lib/model-config';

// 自动选择最佳可用模型
const model = getDynamicModel();

// 在Agent中使用
const agent = new Agent({
  name: 'recommendation-agent',
  model: getDynamicModel(), // 自动选择火山引擎或OpenAI
  // ...
});
```

### 支持的模型配置

| 配置名称            | 提供商   | 模型                            | 用途       |
| ------------------- | -------- | ------------------------------- | ---------- |
| `volcengine-lite`   | 火山引擎 | 豆包-lite-4k                    | 轻量级任务 |
| `volcengine-pro`    | 火山引擎 | 豆包-pro-8k                     | 复杂任务   |
| `openai-gpt4`       | OpenAI   | ep-m-20251024161251-sjljb       | 回退选项   |
| `openai-gpt4-turbo` | OpenAI   | ep-m-20251024161251-sjljb-turbo | 高性能回退 |

### 快速测试
```bash
# 测试动态模型选择
npx tsx src/test/dynamic-model-test.ts

# 测试火山引擎集成
npx tsx src/test/volcengine-test.ts

# 运行使用示例
npx tsx src/examples/volcengine-example.ts
```

### 详细文档
- [动态模型选择机制](./docs/dynamic-model-selection.md)
- [火山引擎集成指南](./docs/volcengine-integration-summary.md)

## 📚 API接口

### 推荐接口
```http
POST /api/recommend
Content-Type: application/json

{
  "userId": "user_123",
  "query": "推荐一些性价比高的手机",
  "context": {
    "budget": 3000,
    "category": "electronics"
  }
}
```

### 聊天接口
```http
POST /api/chat
Content-Type: application/json

{
  "userId": "user_123",
  "message": "我想买一部拍照好的手机",
  "sessionId": "session_456"
}
```

### 用户行为记录
```http
POST /api/user-action
Content-Type: application/json

{
  "userId": "user_123",
  "action": "view",
  "itemId": "product_789",
  "context": {
    "source": "recommendation",
    "timestamp": "2025-01-01T12:00:00Z"
  }
}
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm run test:volcengine
npm run test:memory
npm run test:agents
```

## 📖 文档

- [火山引擎集成说明](./docs/volcengine-integration.md)
- [项目总结](./docs/volcengine-integration-summary.md)
- [API文档](./docs/api-reference.md)
- [部署指南](./docs/deployment.md)

## 🏗️ 项目结构

```
my-recommendation-assistant/
├── src/
│   ├── api/                 # API路由和控制器
│   ├── lib/                 # 核心库和工具
│   │   └── volcengine-provider.ts  # 火山引擎自定义提供商
│   ├── mastra/              # Mastra框架配置
│   │   ├── agents/          # AI代理
│   │   ├── memory/          # 记忆系统
│   │   └── workflows/       # 工作流
│   ├── test/                # 测试文件
│   └── examples/            # 使用示例
├── docs/                    # 项目文档
├── public/                  # 静态资源
└── package.json
```

## 🚀 部署

### Docker部署
```bash
# 构建镜像
docker build -t recommendation-assistant .

# 运行容器
docker run -p 3000:3000 --env-file .env recommendation-assistant
```

### 云平台部署
支持部署到：
- Vercel
- Railway
- Heroku
- 阿里云
- 腾讯云

详细部署指南请参考 [部署文档](./docs/deployment.md)。

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Mastra AI Framework](https://mastra.ai/) - 强大的AI应用开发框架
- [火山引擎](https://www.volcengine.com/) - 提供优秀的豆包大模型服务
- [Vercel AI SDK](https://sdk.vercel.ai/) - 简化AI模型集成
- [Qdrant](https://qdrant.tech/) - 高性能向量数据库

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交Issue: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com
- 微信群: [扫码加入]

---

**让AI为推荐赋能，让智能改变生活！** 🎯