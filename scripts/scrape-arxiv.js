// scripts/scrape-arxiv.js - 爬取 arXiv 论文
const axios = require('axios');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');
const CATEGORIES = ['cs.AI', 'cs.LG', 'cs.DC'];

async function scrapeArxiv() {
  console.log('🚀 开始爬取 arXiv 论文...\n');
  
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  
  let totalAdded = 0;
  
  for (const cat of CATEGORIES) {
    try {
      console.log(`📄 Fetching: ${cat}...`);
      
      const url = `https://export.arxiv.org/api/query?search_query=cat:${cat}&start=0&max_results=30&sortBy=submittedDate&sortOrder=descending`;
      const res = await axios.get(url, { timeout: 30000 });
      const data = res.data;
      
      const entries = data.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
      console.log(`  发现 ${entries.length} 篇论文`);
      
      let added = 0;
      for (const entry of entries.slice(0, 20)) {
        try {
          const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '';
          const pdfUrl = entry.match(/<link href="(https:\/\/arxiv\.org\/pdf\/[^"]+)" rel="related"/)?.[1] || '';
          const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || '';
          const authors = (entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/g) || [])
            .map(a => a.match(/<name>([\s\S]*?)<\/name>/)?.[1])
            .filter(Boolean)
            .join(', ');
          const abstract = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || '';
          const cats = (entry.match(/<category term="([^"]+)"/g) || [])
            .map(c => c.match(/term="([^"]+)"/)?.[1])
            .filter(Boolean)
            .join(',');
          
          if (title && pdfUrl) {
            db.run(`
              INSERT OR IGNORE INTO papers (title, authors, abstract, pdf_url, published_date, categories)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [title, authors, abstract, pdfUrl, published.split('T')[0], cats]);
            added++;
          }
        } catch (e) {}
      }
      
      totalAdded += added;
      console.log(`  ✅ 添加 ${added} 篇`);
      
    } catch (error) {
      console.log(`  ❌ ${error.message}`);
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log(`\n🎉 完成！共添加 ${totalAdded} 篇论文`);
}

scrapeArxiv().catch(console.error);
