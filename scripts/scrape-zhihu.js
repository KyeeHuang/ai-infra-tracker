// scripts/scrape-zhihu.js - 爬取知乎高赞文章（修复版）
const puppeteer = require('puppeteer');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');
const VOTE_THRESHOLD = 50;

const AI_INFRA_KEYWORDS = [
  'vLLM',
  'LLM推理',
  'TensorRT',
  'FlashAttention',
  'DeepSeek',
  '模型量化',
  '分布式训练',
  'CUDA'
];

async function scrapeZhihu() {
  console.log(`🚀 开始爬取知乎高赞文章 (赞同 > ${VOTE_THRESHOLD})...\n`);
  
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  
  // 清空旧数据
  db.run("DELETE FROM blogs WHERE source='知乎文章'");
  
  let totalScraped = 0;
  
  try {
    console.log('🔗 连接到Chrome浏览器...');
    
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: { width: 1280, height: 900 }
    });
    
    const page = await browser.newPage();
    
    for (const keyword of AI_INFRA_KEYWORDS) {
      console.log(`\n🔍 搜索: "${keyword}"`);
      
      try {
        const searchUrl = `https://www.zhihu.com/search?type=article&q=${encodeURIComponent(keyword)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // 等待页面加载
        await new Promise(r => setTimeout(r, 3000));
        
        // 使用更通用的选择器
        const articles = await page.evaluate((threshold) => {
          const results = [];
          
          // 查找所有链接
          const allLinks = document.querySelectorAll('a[href*="/p/"]');
          
          allLinks.forEach(link => {
            const title = link.textContent?.trim() || '';
            const url = link.href;
            const parent = link.closest('article') || link.parentElement?.closest('article') || link.closest('div');
            
            // 查找投票数
            let votes = 0;
            const voteText = parent?.textContent?.match(/[\d,]+赞同/) || parent?.textContent?.match(/\d+赞/);
            if (voteText) {
              votes = parseInt(voteText[0].replace(/[^0-9]/g, '')) || 0;
            }
            
            if (title && title.length > 10 && url.includes('/p/') && url.includes('zhihu.com') && votes >= threshold) {
              if (!results.find(r => r.url === url)) {
                results.push({ title: title.substring(0, 100), url, votes });
              }
            }
          });
          
          results.sort((a, b) => b.votes - a.votes);
          return results.slice(0, 8);
        }, VOTE_THRESHOLD);
        
        console.log(`  📊 扫描完成，找到 ${articles.length} 篇高赞文章`);
        
        for (const art of articles) {
          try {
            db.run(`
              INSERT INTO blogs 
              (title, url, author, organization, summary, published_date, tags, source)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              art.title, art.url, '知乎用户', '知乎',
              `高赞文章 (👍${art.votes})`,
              new Date().toISOString().split('T')[0],
              `ai-infra,${keyword}`,
              '知乎文章'
            ]);
            totalScraped++;
            console.log(`  ✅ ${art.title.substring(0, 30)}... (👍${art.votes})`);
          } catch (e) {}
        }
        
      } catch (error) {
        console.log(`  ⚠️ 搜索失败: ${error.message}`);
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }
    
    await browser.close();
    
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
  }
  
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log(`\n🎉 完成！共添加 ${totalScraped} 篇高赞知乎文章`);
}

scrapeZhihu().catch(console.error);
