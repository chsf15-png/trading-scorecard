-- 创建交易评分表
CREATE TABLE trading_scores (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  dimensions JSONB NOT NULL,
  total_score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 创建收益记录表
CREATE TABLE trading_profits (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  profit DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 创建核心持仓表
CREATE TABLE core_positions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  percentage DECIMAL(5, 1) NOT NULL,
  logic TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX idx_trading_scores_user_id ON trading_scores(user_id);
CREATE INDEX idx_trading_profits_user_id ON trading_profits(user_id);
CREATE INDEX idx_core_positions_user_id ON core_positions(user_id);
