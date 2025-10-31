import { Pool } from 'pg';

// PostgreSQL 配置
export const createPgPool = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return pool;
};

// 数据库表结构定义
export const DATABASE_SCHEMAS = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      user_id VARCHAR(255) PRIMARY KEY,
      registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      membership_level VARCHAR(50) DEFAULT 'bronze',
      static_attributes JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  user_preferences: `
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id VARCHAR(255) PRIMARY KEY,
      category_counts JSONB DEFAULT '{}',
      brand_counts JSONB DEFAULT '{}',
      price_range JSONB,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
  `,
  
  user_action_logs: `
    CREATE TABLE IF NOT EXISTS user_action_logs (
      log_id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      item_id VARCHAR(255) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
  `,
  
  recommendation_feedback: `
    CREATE TABLE IF NOT EXISTS recommendation_feedback (
      feedback_id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      item_id VARCHAR(255) NOT NULL,
      recommendation_id VARCHAR(255) NOT NULL,
      clicked BOOLEAN DEFAULT FALSE,
      purchased BOOLEAN DEFAULT FALSE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
  `,
  
  products: `
    CREATE TABLE IF NOT EXISTS products (
      item_id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      brand VARCHAR(255),
      category VARCHAR(255),
      price DECIMAL(10,2),
      in_stock BOOLEAN DEFAULT TRUE,
      tags TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
};

// 数据库索引
export const DATABASE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_user_action_logs_user_id ON user_action_logs(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_user_action_logs_timestamp ON user_action_logs(timestamp);',
  'CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_id ON recommendation_feedback(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);',
  'CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);',
  'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);',
];

// 初始化数据库
export const initializeDatabase = async () => {
  const pool = createPgPool();
  
  try {
    // 创建表
    for (const [tableName, schema] of Object.entries(DATABASE_SCHEMAS)) {
      await pool.query(schema);
      console.log(`Table ${tableName} created or already exists`);
    }
    
    // 创建索引
    for (const indexQuery of DATABASE_INDEXES) {
      await pool.query(indexQuery);
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};