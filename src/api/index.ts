import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import applianceHandler from './appliance';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, '../../public')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Recommendation Assistant API'
  });
});

// 推荐接口
app.post('/api/recommend', async (req, res) => {
  try {
    const { userId, query, context } = req.body;
    
    // 模拟推荐结果
    const mockRecommendations = [
      {
        id: 'product_1',
        name: 'iPhone 15 Pro',
        category: 'Electronics',
        price: 999,
        score: 0.95,
        reason: '基于您的浏览历史和偏好推荐'
      },
      {
        id: 'product_2', 
        name: 'MacBook Air M3',
        category: 'Electronics',
        price: 1299,
        score: 0.88,
        reason: '与您查看的商品相似'
      }
    ];
    
    res.json({
      success: true,
      recommendations: mockRecommendations,
      userId,
      query,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 聊天接口
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    // 生成智能回复
    let responseText = '';
    let intent = 'general_inquiry';
    
    // 简单的意图识别
    if (message.includes('记得') || message.includes('名字') || message.includes('之前')) {
      responseText = '我会记住我们的对话！有什么我可以帮助您的吗？';
      intent = 'memory_inquiry';
    } else if (message.includes('我叫') || message.includes('我是')) {
      const nameMatch = message.match(/我叫(\S+)|我是(\S+)/);
      if (nameMatch) {
        const name = nameMatch[1] || nameMatch[2];
        responseText = `很高兴认识您，${name}！有什么我可以为您推荐的吗？`;
        intent = 'user_introduction';
      }
    } else if (message.includes('智能家电') || message.includes('家电') || message.includes('电器')) {
      responseText = `我看到您对智能家电感兴趣！我可以为您推荐一些优质的智能家电产品，比如智能冰箱、智能洗衣机、智能空调等。请问您具体想了解哪类家电呢？`;
      intent = 'product_inquiry';
    } else {
      responseText = `您好！我是您的购物助手。您提到了"${message}"，我可以为您推荐一些相关的商品。请问您有什么特定的需求吗？`;
      intent = 'general_inquiry';
    }
    
    const response = {
      text: responseText,
      intent,
      suggestions: [
        '查看热门商品',
        '浏览特价商品', 
        '个性化推荐'
      ]
    };
    
    res.json({
      success: true,
      response,
      userId,
      sessionId: `chat_${userId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      memoryUsed: false,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 家电推荐接口
app.post('/api/appliance', async (req, res) => {
  try {
    // 创建模拟的请求和响应对象
    const mockReq = {
      method: 'POST',
      body: req.body,
      headers: req.headers,
    };

    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          res.status(code).json(data);
        }
      }),
      json: (data: any) => {
        res.json(data);
      }
    };

    await applianceHandler(mockReq as any, mockRes as any);
  } catch (error) {
    console.error('Appliance API error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 用户行为记录接口
app.post('/api/user-action', async (req, res) => {
  try {
    const { userId, action, itemId, context } = req.body;
    
    // 模拟行为记录
    const actionRecord = {
      id: `action_${Date.now()}`,
      userId,
      action,
      itemId,
      context,
      timestamp: new Date().toISOString(),
      processed: true
    };
    
    res.json({
      success: true,
      actionRecord,
      message: '用户行为已记录'
    });
  } catch (error) {
    console.error('User action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record user action',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default app;