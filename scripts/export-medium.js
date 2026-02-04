// scripts/export-medium.js - 导出Medium数据
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');
const OUTPUT_PATH = path.join(__dirname, '../data/medium.json');

async function exportMedium() {
  console.log('📤 导出Medium数据...');
  
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  
  const result = db.exec('SELECT * FROM blogs WHERE source="Medium" ORDER BY published_date DESC');
  
  if (result[0]) {
    const blogs = result[0].values.map(row => ({
      title: row[1],
      url: row[2],
      author: row[3],
      organization: row[4],
      excerpt: row[5],
      published_date: row[6],
      tags: row[7]?.split(',') || [],
      source: row[8]
    }));
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(blogs, null, 2));
    console.log(`✅ 已导出 ${blogs.length} 篇Medium文章`);
    console.log(`📁 保存到: ${OUTPUT_PATH}`);
  } else {
    console.log('⚠️ 没有找到Medium文章');
  }
  
  db.close();
}

exportMedium();
