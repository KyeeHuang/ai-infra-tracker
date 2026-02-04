// scripts/scrape-medium.js - 爬取 Medium AI Infra 文章
const puppeteer = require('puppeteer');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');

const MEDIUM_TOPICS = [
  { name: 'vLLM', url: 'https://medium.com/tag/vllm' },
  { name: 'LLM Inference', url: 'https://medium.com/tag/llm-inference' },
  { name: 'FlashAttention', url: 'https://medium.com/tag/flash-attention' },
  { name: 'DeepSeek', url: 'https://medium.com/tag/deepseek' },
  { name: 'TensorRT', url: 'https://medium.com/tag/tensorrt' },
  { name: 'Model Quantization', url: 'https://medium.com/tag/model-quantization' },
  { name: 'Distributed Training', url: 'https://medium.com/tag/distributed-training' },
  { name: 'GPU Optimization', url: 'https://medium.com/tag/gpu-optimization' },
];

async function scrapeMedium() {
  console.log('🚀 开始爬取 Medium AI Infra 文章...\n');
  
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  
  // 清空旧 Medium 数据
  db.run("DELETE FROM blogs WHERE source='Medium'");
  
  let totalAdded = 0;
  
  try {
    console.log('🔗 连接到Chrome...');
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: { width: 1280, height: 900 }
    });
    
    const page = await browser.newPage();
    
    for (const topic of MEDIUM_TOPICS) {
      console.log(`\n🔍 爬取: ${topic.name}`);
      
      try {
        await page.goto(topic.url, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 5000));
        
        // 滚动加载更多
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
          await new Promise(r => setTimeout(r, 3000));
        }
        
        // 提取文章
        const articles = await page.evaluate(() => {
          const results = [];
          const cards = document.querySelectorAll('article, .post-item, .流式卡片');
          
          cards.forEach(card => {
            const link = card.querySelector('a[href*="/@"]') || card.querySelector('a[href*="/p/"]');
            const title = card.querySelector('h2, h3, .post-item-title') || card.querySelector('a');
            const author = card.querySelector('.post-item-author, .流式作者, a[href*="/@"]');
            const date = card.querySelector('.post-item-date, time');
            const excerpt = card.querySelector('.post-item-excerpt, p') || card.querySelector('.summary');
            const claps = card.querySelector('.post-item-claps, .claps');
            
            if (link && title) {
              const titleText = title.textContent?.trim() || '';
              const url = link.href || (link.closest('a')?.href);
              
              if (titleText && titleText.length > 10 && url && url.includes('medium.com/')) {
                results.push({
                  title: titleText.substring(0, 100),
                  url: url,
                  author: author?.textContent?.trim() || 'Medium Author',
                  date: date?.textContent?.trim() || date?.getAttribute('datetime')?.split('T')[0] || new Date().toISOString().split('T')[0],
                  excerpt: excerpt?.textContent?.trim()?.substring(0, 200) || '',
                  claps: claps?.textContent?.trim() || '0'
                });
              }
            }
          });
          
          // 去重
          const unique = [];
          const seen = new Set();
          results.forEach(r => {
            if (!seen.has(r.url)) {
              seen.add(r.url);
              unique.push(r);
            }
          });
          return unique.slice(0, 10);
        });
        
        console.log(`  📊 发现 ${articles.length} 篇文章`);
        
        for (const art of articles) {
          try {
            db.run(`
              INSERT INTO blogs (title, url, author, organization, summary, published_date, tags, source)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              art.title, art.url, art.author, 'Medium',
              art.excerpt || `Medium文章 (👏${art.claps})`,
              art.date,
              `ai-infra,${topic.name}`,
              'Medium'
            ]);
            totalAdded++;
            console.log(`  ✅ ${art.title.substring(0, 35)}...`);
          } catch (e) {
            console.log(`  ⚠️ 插入失败`);
          }
        }
        
      } catch (error) {
        console.log(`  ⚠️ 爬取失败: ${error.message.substring(0, 50)}`);
      }
      
      await new Promise(r => setTimeout(r, 5000));
    }
    
    await browser.close();
    
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
  }
  
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log(`\n🎉 完成！共添加 ${totalAdded} 篇 Medium 文章`);
}

scrapeMedium().catch(console.error);
