const puppeteer = require('puppeteer');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');
const KEYWORDS = ['vLLM', 'FlashAttention', 'DeepSeek', 'TensorRT', 'LLM推理'];

async function scrape() {
  console.log('🚀 开始爬取知乎高赞文章...\n');
  
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  db.run("DELETE FROM blogs WHERE source='知乎文章'");
  
  let total = 0;
  
  try {
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: { width: 1280, height: 900 }
    });
    console.log('✅ 已连接Chrome\n');
    
    const page = await browser.newPage();
    
    for (const keyword of KEYWORDS) {
      console.log(`🔍 搜索: "${keyword}"`);
      
      try {
        await page.goto(`https://www.zhihu.com/search?type=article&q=${encodeURIComponent(keyword)}`, 
          { waitUntil: 'networkidle2', timeout: 30000 });
        
        await new Promise(r => setTimeout(r, 5000));
        
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
          await new Promise(r => setTimeout(r, 2000));
        }
        
        const articles = await page.evaluate((threshold) => {
          const results = [];
          const links = document.querySelectorAll('a[href*="/p/"]');
          
          links.forEach(link => {
            const href = link.href;
            const title = link.textContent?.trim() || '';
            const parent = link.closest('div') || link.parentElement?.parentElement;
            
            if (href && title && title.length > 10 && href.includes('/p/')) {
              let votes = 0;
              const text = parent?.textContent || '';
              const match = text.match(/(\d{3,}(?:,\d{3})*)\s*(?:赞同|赞)/) || text.match(/👍[\s]*(\d{3,})/);
              if (match) votes = parseInt(match[1].replace(/,/g, ''));
              
              if (votes >= threshold) {
                results.push({ title: title.substring(0, 100), url: href, votes });
              }
            }
          });
          
          const unique = [];
          const seen = new Set();
          results.forEach(r => {
            if (!seen.has(r.url)) {
              seen.add(r.url);
              unique.push(r);
            }
          });
          return unique.sort((a, b) => b.votes - a.votes).slice(0, 10);
        }, 200);
        
        console.log(`  📊 发现 ${articles.length} 篇`);
        
        for (const art of articles) {
          db.run(`INSERT INTO blogs VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [null, art.title, art.url, '知乎用户', '知乎', `高赞文章 (👍${art.votes})`, 
             new Date().toISOString().split('T')[0], `ai-infra,${keyword}`, '知乎文章', 0]);
          total++;
          console.log(`  ✅ ${art.title.substring(0, 35)}... (👍${art.votes})`);
        }
        
      } catch (e) {
        console.log(`  ⚠️ ${e.message.substring(0, 40)}`);
      }
      
      await new Promise(r => setTimeout(r, 3000));
    }
    
    await browser.close();
    
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
  }
  
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log(`\n🎉 完成！共 ${total} 篇`);
}

scrape();
