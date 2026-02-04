const puppeteer = require('puppeteer');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');
const TOPICS = ['vllm', 'llm-inference', 'flash-attention', 'model-quantization'];

async function scrape() {
  console.log('🚀 爬取 Medium AI Infra 文章...\n');
  
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  db.run("DELETE FROM blogs WHERE source='Medium'");
  
  let total = 0;
  
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: process.argv[2],
      defaultViewport: { width: 1280, height: 900 }
    });
    
    const page = await browser.newPage();
    
    for (const topic of TOPICS) {
      console.log(`🔍 ${topic}`);
      
      try {
        await page.goto(`https://medium.com/tag/${topic}`, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 5000));
        
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
          await new Promise(r => setTimeout(r, 2000));
        }
        
        const articles = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('article, .post-item').forEach(card => {
            const link = card.querySelector('a[href*="/p/"]') || card.querySelector('a[href*="/@"]');
            const title = card.querySelector('h2, h3');
            const author = card.querySelector('.post-item-author, a[href*="/@"]');
            const excerpt = card.querySelector('.post-item-excerpt, p');
            
            if (link && title) {
              const url = link.href || link.closest('a')?.href;
              const titleText = title.textContent?.trim() || '';
              
              if (titleText && url && url.includes('medium.com/') && !results.find(r => r.url === url)) {
                results.push({
                  title: titleText.substring(0, 100),
                  url: url,
                  author: author?.textContent?.trim() || 'Medium Author',
                  excerpt: excerpt?.textContent?.trim()?.substring(0, 150) || ''
                });
              }
            }
          });
          return results.slice(0, 8);
        });
        
        console.log(`  📊 ${articles.length} 篇`);
        
        for (const art of articles) {
          db.run(`INSERT INTO blogs VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [null, art.title, art.url, art.author, 'Medium', art.excerpt || 'Medium文章',
             new Date().toISOString().split('T')[0], `ai-infra,${topic}`, 'Medium', 0]);
          total++;
          console.log(`  ✅ ${art.title.substring(0, 30)}...`);
        }
        
      } catch (e) {
        console.log(`  ⚠️ ${e.message.substring(0, 30)}`);
      }
      
      await new Promise(r => setTimeout(r, 4000));
    }
    
    await browser.close();
    
  } catch (error) {
    console.error(`❌ ${error.message}`);
  }
  
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log(`\n🎉 共 ${total} 篇`);
}

scrape();
