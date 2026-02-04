// scripts/scrape-medium-search.js - 使用搜索获取正确链接
const puppeteer = require('puppeteer');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');
const OUTPUT_PATH = path.join(__dirname, '../data/medium.json');

const SEARCH_QUERIES = [
  'vLLM inference optimization',
  'FlashAttention GPU optimization',
  'DeepSeek V3 model',
  'TensorRT LLM',
  'LLM model quantization',
  'distributed training GPU',
  'LLMKV cache optimization',
  'continuous batching inference'
];

async function scrapeMedium() {
  console.log('🚀 通过搜索爬取 Medium AI Infra 文章...\n');
  
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
    
    for (const query of SEARCH_QUERIES) {
      console.log(`\n🔍 搜索: "${query}"`);
      
      try {
        // 使用Medium搜索
        await page.goto(`https://medium.com/search?q=${encodeURIComponent(query)}`, { 
          waitUntil: 'networkidle2', 
          timeout: 60000 
        });
        
        await new Promise(r => setTimeout(r, 5000));
        
        // 滚动加载
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
          await new Promise(r => setTimeout(r, 3000));
        }
        
        // 提取搜索结果中的文章链接
        const articles = await page.evaluate(() => {
          const results = [];
          
          // 查找所有搜索结果链接
          const links = document.querySelectorAll('a[href*="/p/"]');
          
          links.forEach(a => {
            const href = a.href;
            const parent = a.closest('div') || a.parentElement;
            
            // 获取标题 - 通常是链接内的文本或相邻的标题元素
            let title = a.textContent?.trim();
            if (!title || title.length < 10) {
              const titleEl = parent?.querySelector('h2, h3, h4');
              title = titleEl?.textContent?.trim();
            }
            
            // 获取作者
            let author = '';
            const authorLink = parent?.querySelector('a[href*="/@"]');
            if (authorLink) {
              author = authorLink.textContent?.trim().replace(/^@/, '') || '';
            }
            
            // 清理URL
            let cleanUrl = href.split('?')[0];
            
            // 确保是medium.com的文章链接
            if (title && title.length > 10 && cleanUrl && cleanUrl.includes('medium.com/') && cleanUrl.includes('/p/')) {
              if (!results.find(r => r.url === cleanUrl)) {
                results.push({
                  title: title.substring(0, 100).replace(/\n/g, ' '),
                  url: cleanUrl,
                  author: author || 'Medium Author',
                  date: new Date().toISOString().split('T')[0],
                  excerpt: ''
                });
              }
            }
          });
          
          return results.slice(0, 8);
        });
        
        console.log(`  📊 发现 ${articles.length} 篇文章`);
        
        for (const art of articles) {
          if (!allArticles.find(r => r.url === art.url)) {
            allArticles.push(art);
            console.log(`  ✅ ${art.title.substring(0, 40)}...`);
            console.log(`     🔗 ${art.url.substring(0, 50)}...`);
          }
        }
        
      } catch (error) {
        console.log(`  ⚠️ 失败: ${error.message.substring(0, 40)}`);
      }
      
      await new Promise(r => setTimeout(r, 4000));
    }
    
    await browser.close();
    
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
  }
  
  // 保存到数据库和文件
  for (const art of allArticles) {
    try {
      db.run(`
        INSERT INTO blogs (title, url, author, organization, summary, published_date, tags, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        art.title, art.url, art.author, 'Medium',
        `Medium技术文章`,
        art.date,
        'ai-infra,medium',
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
    excerpt: `Medium技术文章`,
    published_date: art.date,
    tags: ['ai-infra', 'medium'],
    source: 'Medium'
  }));
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(blogs, null, 2));
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log(`\n🎉 完成！共 ${totalAdded} 篇 Medium 文章`);
}

scrapeMedium().catch(console.error);
