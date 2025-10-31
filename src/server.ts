import 'dotenv/config'; // 加载环境变量
import app from './api';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 添加静态文件服务
app.use(express.static(path.join(__dirname, 'frontend')));

// 前端路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'appliance-recommendation.html'));
});

const port = process.env.API_PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 Recommendation Assistant API running on port ${port}`);
  console.log(`🏠 Frontend Interface: http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat API: http://localhost:${port}/api/chat`);
  console.log(`🎯 Recommendation API: http://localhost:${port}/api/recommend`);
  console.log(`🏠 Appliance API: http://localhost:${port}/api/appliance`);
  console.log(`📝 User Action API: http://localhost:${port}/api/user-action`);
});