# Mastra记忆系统部署指南

## 概述

本指南详细说明如何在生产环境中部署基于Mastra的智能推荐助手系统。该系统使用Mastra原生记忆系统，提供高性能的用户行为记忆和个性化推荐功能。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   Next.js API   │    │   PostgreSQL    │
│   (React)       │◄──►│   (Mastra)      │◄──►│   数据库        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Mastra记忆    │
                       │   系统          │
                       └─────────────────┘
```

## 环境要求

### 最低系统要求
- **CPU**: 2核心 (推荐4核心)
- **内存**: 4GB RAM (推荐8GB)
- **存储**: 20GB SSD (推荐50GB)
- **网络**: 100Mbps带宽

### 推荐生产环境
- **CPU**: 4-8核心
- **内存**: 16-32GB RAM
- **存储**: 100GB+ SSD
- **网络**: 1Gbps带宽

### 软件依赖
- **Node.js**: 18.x 或更高版本
- **PostgreSQL**: 14.x 或更高版本
- **Redis**: 6.x 或更高版本 (可选，用于缓存)
- **Docker**: 20.x 或更高版本 (可选)

## 部署步骤

### 1. 环境准备

#### 1.1 安装Node.js
```bash
# 使用nvm安装Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### 1.2 安装PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# macOS
brew install postgresql
brew services start postgresql
```

#### 1.3 配置PostgreSQL
```sql
-- 创建数据库和用户
CREATE DATABASE recommendation_assistant;
CREATE USER mastra_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE recommendation_assistant TO mastra_user;

-- 配置连接参数
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

### 2. 应用部署

#### 2.1 克隆代码
```bash
git clone <repository-url>
cd my-recommendation-assistant
```

#### 2.2 安装依赖
```bash
npm install
```

#### 2.3 环境配置
```bash
# 复制环境变量模板
cp .env.example .env.production

# 编辑生产环境配置
nano .env.production
```

#### 2.4 环境变量配置
```env
# 应用配置
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 数据库配置
DATABASE_URL=postgresql://mastra_user:your_secure_password@localhost:5432/recommendation_assistant
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recommendation_assistant
DB_USER=mastra_user
DB_PASSWORD=your_secure_password

# Mastra配置
MASTRA_LOG_LEVEL=info
MASTRA_MEMORY_ENABLED=true
MASTRA_PERFORMANCE_MONITORING=true

# 安全配置
JWT_SECRET=your_jwt_secret_key
API_KEY=your_api_key
CORS_ORIGIN=https://yourdomain.com

# 外部服务配置
OPENAI_API_KEY=your_openai_api_key
WEATHER_API_KEY=your_weather_api_key

# 性能优化配置
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_QUERY_TIMEOUT=30000
CACHE_TTL=3600
BATCH_SIZE=100
```

#### 2.5 数据库初始化
```bash
# 运行数据库迁移
npm run db:migrate

# 初始化种子数据
npm run db:seed
```

#### 2.6 构建应用
```bash
npm run build
```

### 3. 生产环境启动

#### 3.1 使用PM2管理进程
```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'recommendation-assistant',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048'
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3.2 使用Docker部署
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://mastra_user:password@db:5432/recommendation_assistant
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=recommendation_assistant
      - POSTGRES_USER=mastra_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# 使用Docker Compose部署
docker-compose up -d
```

### 4. 反向代理配置

#### 4.1 Nginx配置
```nginx
# /etc/nginx/sites-available/recommendation-assistant
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # 代理配置
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4.2 启用Nginx配置
```bash
sudo ln -s /etc/nginx/sites-available/recommendation-assistant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 监控和日志

### 1. 应用监控

#### 1.1 健康检查端点
```bash
# 检查应用状态
curl http://localhost:3000/api/health

# 检查数据库连接
curl http://localhost:3000/api/health/db

# 检查记忆系统状态
curl http://localhost:3000/api/health/memory
```

#### 1.2 性能监控
```bash
# 运行性能测试
node test-memory-performance.js

# 查看PM2监控
pm2 monit

# 查看系统资源
htop
iostat -x 1
```

### 2. 日志管理

#### 2.1 日志配置
```bash
# 创建日志目录
mkdir -p /var/log/recommendation-assistant
chown -R $USER:$USER /var/log/recommendation-assistant

# 配置日志轮转
cat > /etc/logrotate.d/recommendation-assistant << EOF
/var/log/recommendation-assistant/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

#### 2.2 日志查看
```bash
# 查看应用日志
pm2 logs recommendation-assistant

# 查看错误日志
tail -f /var/log/recommendation-assistant/error.log

# 查看访问日志
tail -f /var/log/nginx/access.log
```

## 备份和恢复

### 1. 数据库备份
```bash
# 创建备份脚本
cat > backup-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="recommendation_assistant"

mkdir -p $BACKUP_DIR

# 创建数据库备份
pg_dump -h localhost -U mastra_user -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x backup-db.sh

# 设置定时备份
crontab -e
# 添加以下行（每天凌晨2点备份）
0 2 * * * /path/to/backup-db.sh
```

### 2. 数据恢复
```bash
# 恢复数据库
gunzip -c /backup/postgresql/db_backup_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U mastra_user -d recommendation_assistant
```

## 安全配置

### 1. 防火墙配置
```bash
# Ubuntu/Debian (ufw)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. SSL证书配置
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 3. 数据库安全
```sql
-- 限制数据库连接
ALTER SYSTEM SET listen_addresses = 'localhost';

-- 配置SSL连接
ALTER SYSTEM SET ssl = on;

-- 设置连接限制
ALTER USER mastra_user CONNECTION LIMIT 50;
```

## 性能优化

### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX CONCURRENTLY idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX CONCURRENTLY idx_user_actions_timestamp ON user_actions(timestamp);
CREATE INDEX CONCURRENTLY idx_products_category ON products(category);

-- 分析表统计信息
ANALYZE;

-- 配置自动清理
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_max_workers = 3;
```

### 2. 应用优化
```bash
# 启用Node.js集群模式
export UV_THREADPOOL_SIZE=16

# 优化内存使用
export NODE_OPTIONS="--max-old-space-size=2048"

# 启用压缩
export COMPRESSION=true
```

## 故障排除

### 常见问题

#### 1. 数据库连接问题
```bash
# 检查数据库状态
sudo systemctl status postgresql

# 检查连接数
psql -U mastra_user -d recommendation_assistant -c "SELECT count(*) FROM pg_stat_activity;"

# 重启数据库
sudo systemctl restart postgresql
```

#### 2. 内存不足
```bash
# 检查内存使用
free -h
ps aux --sort=-%mem | head

# 重启应用
pm2 restart recommendation-assistant
```

#### 3. 性能问题
```bash
# 检查慢查询
psql -U mastra_user -d recommendation_assistant -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 分析系统负载
top
iotop
```

## 维护计划

### 日常维护
- 检查应用状态和日志
- 监控系统资源使用
- 检查数据库性能

### 周期性维护
- **每周**: 检查备份完整性
- **每月**: 更新系统补丁
- **每季度**: 性能测试和优化
- **每年**: 安全审计和证书更新

## 联系支持

如果在部署过程中遇到问题，请：

1. 检查日志文件获取错误信息
2. 参考故障排除部分
3. 联系技术支持团队

---

**注意**: 请根据实际环境调整配置参数，确保在生产环境中进行充分测试。