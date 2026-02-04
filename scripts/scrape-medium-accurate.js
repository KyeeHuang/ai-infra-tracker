// scripts/scrape-medium-accurate.js - 重新爬取Medium，获取正确链接
const puppeteer = require('puppeteer');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');
const OUTPUT_PATH = path.join(__dirname, '../data/medium.json');

const MEDIUM_TOPICS = [
  { name: 'vLLM', url: 'https://medium.com/tag/vllm' },
  { name: 'LLM Inference', url: 'https://medium.com/tag/llm-inference' },
  { name: 'FlashAttention', url: 'https://medium.com/tag/flash-attention' },
  { name: 'Model Quantization', url: 'https://medium.com/tag/model-quantization' },
  { name: 'Distributed Training', url: 'https://medium.com/tag/distributed-training' },
  { name: 'GPU Optimization', url: 'https://medium.com/tag/gpu-optimization' },
  { name: 'DeepSeek', url: 'https://medium.com/tag/deepseek' },
  { name: 'TensorRT', url: 'https://medium.com/tag/tensorrt' },
];

async function scrapeMedium() {
  console.log('🚀 重新爬取 Medium AI Infra 文章...\n');
  
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  db.run("DELETE FROM blogs WHERE source='Medium'");
  
  let totalAdded = 0;
  const allArticles = [];
  
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
        for (let i = 0; i < 4; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
          await new Promise(r => setTimeout(r, 3000));
        }
        
        // 提取文章 - 使用多种选择器
        const articles = await page.evaluate(() => {
          const results = [];
          
          // Medium新页面的卡片选择器
          const cards = document.querySelectorAll('article, div[role="article"], .post-item, .流式卡片');
          
          cards.forEach(card => {
            // 找文章链接 - 直接点击整个卡片或标题
            const link = card.querySelector('a[href*="/p/"]');
            const titleEl = card.querySelector('h2, h3, .post-item-title') || card.querySelector('a');
            const authorEl = card.querySelector('a[href*="/@"], .post-item-author');
            const dateEl = card.querySelector('time, .post-item-date');
            const excerptEl = card.querySelector('.post-item-excerpt, p, .summary');
            const clapEl = card.querySelector('.claps, .post-item-claps');
            
            let title = titleEl?.textContent?.trim() || '';
            let url = link?.href || '';
            
            // 清理URL，去除source参数
            if (url && url.includes('?')) {
              url = url.split('?')[0];
            }
            
            // 确保是文章链接
            if (title && title.length > 10 && url && url.includes('medium.com/') && url.includes('/p/')) {
              // 避免重复
              if (!results.find(r => r.url === url)) {
                results.push({
                  title: title.substring(0, 100).replace(/\n/g, ' '),
                  url: url,
                  author: authorEl?.textContent?.trim() || 'Medium Author',
                  date: dateEl?.textContent?.trim() || new Date().toISOString().split('T')[0],
                  excerpt: excerptEl?.textContent?.trim()?.substring(0, 200)?.replace(/\n/g, ' ') || '',
                  claps: clapEl?.textContent?.trim() || '0'
                });
              }
            }
          });
          
          // 如果上述方法没找到，尝试其他方式
          if (results.length === 0) {
            const links = document.querySelectorAll('a[href*="/p/"]');
            links.forEach(a => {
              const href = a.href;
              const title = a.textContent?.trim() || '';
              if (href && href.includes('/p/') && title && title.length > 10 && !results.find(r => r.url === href)) {
                results.push({
                  title: title.substring(0, 100).replace(/\n/g, ' '),
                  url: href.split('?')[0],
                  author: 'Medium Author',
                  date: new Date().toISOString().split('T')[0],
                  excerpt: '',
                  claps: '0'
                });
              }
            });
          }
          
          return results.slice(0, 12);
        });
        
        console.log(`  📊 发现 ${articles.length} 篇文章`);
        
        for (const art of articles) {
          allArticles.push({ ...art, topic: topic.name });
          console.log(`  ✅ ${art.title.substring(0, 40)}...`);
          console.log(`     🔗 ${art.url.substring(0, 60)}...`);
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
  
  // 保存到数据库
  for (const art of allArticles) {
    try {
      db.run(`
        INSERT INTO blogs (title, url, author, organization, summary, published_date, tags, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        art.title, art.url, art.author, 'Medium',
        art.excerpt || `Medium文章 (👏${art.claps})`,
        art.date,
        `ai-infra,${art.topic}`,
        'Medium'
      ]);
      totalAdded++;
    } catch (e) {}
  }
  
  // 导出为JSON
  const blogs = allArticles.map(art => ({
    title: art.title,
    url: art.url,
    author: art.author,
    organization: 'Medium',
    excerpt: art.excerpt || `Medium文章 (👏${art.claps})`,
    published_date: art.date,
    tags: [`ai-infra`, art.topic],
    source: 'Medium'
  }));
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(blogs, null, 2));
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log(`\n🎉 完成！共 ${totalAdded} 篇 Medium 文章`);
  console.log(`📁 已保存到: ${OUTPUT_PATH}`);
}

scrapeMedium().catch(console.error);
