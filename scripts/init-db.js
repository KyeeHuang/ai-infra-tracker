// scripts/init-db.js - 初始化数据库
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');

async function initDB() {
  console.log('🔧 初始化数据库...');
  
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      full_name TEXT UNIQUE,
      description TEXT,
      url TEXT,
      stars INTEGER,
      forks INTEGER,
      open_issues INTEGER,
      watchers INTEGER,
      language TEXT,
      license TEXT,
      updated_at TEXT,
      topics TEXT,
      scraped_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      authors TEXT,
      abstract TEXT,
      pdf_url TEXT UNIQUE,
      published_date TEXT,
      categories TEXT,
      scraped_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT UNIQUE,
      author TEXT,
      organization TEXT,
      summary TEXT,
      published_date TEXT,
      scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
      tags TEXT,
      source TEXT,
      deleted INTEGER DEFAULT 0
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS user_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      liked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(item_type, item_id)
    )
  `);
  
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log('✅ 数据库已初始化');
  console.log(`📁 Database: ${DB_PATH}`);
}

initDB();
