// scripts/scrape-zhihu-automated.js - 使用已登录的Chrome爬取知乎
const puppeteer = require('puppeteer');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');
const VOTE_THRESHOLD = 200;

const AI_INFRA_KEYWORDS = [
  'vLLM',
  'LLM 推理',
  'TensorRT', 
  'FlashAttention',
  'DeepSeek',
  '模型量化',
  '分布式训练',
  'CUDA 优化'
];

async function scrapeZhihuWithLoggedInChrome() {
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
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        await new Promise(r => setTimeout(r, 5000));
        
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
          await new Promise(r => setTimeout(r, 2000));
        }
        
        const articles = await page.evaluate((threshold) => {
          const results = [];
          const cards = document.querySelectorAll('.SearchResult-Item, .ContentItem, article, .zm-item');
          
          cards.forEach(card => {
            const link = card.querySelector('a[href*="/p/"]');
            const title = card.querySelector('h2, .Title, .ContentItem-title a, .zm-item-title a');
            
            if (link && title) {
              const titleText = title.textContent?.trim() || '';
              const url = link.href;
              
              if (titleText && titleText.length > 10 && url.includes('/p/')) {
                let votes = 0;
                const cardText = card.textContent || '';
                const voteMatch = cardText.match(/(\d{3,}(?:,\d{3})*)\s*(?:赞同|赞|upvote)/i) ||
                                cardText.match(/👍[\s]*(\d{3,})/);
                if (voteMatch) {
                  votes = parseInt(voteMatch[1].replace(/,/g, ''));
                }
                
                if (votes >= threshold) {
                  results.push({ 
                    title: titleText.substring(0, 100), 
                    url, 
                    votes 
                  });
                }
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
        }, VOTE_THRESHOLD);
        
        console.log(`  📊 发现 ${articles.length} 篇高赞文章`);
        
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
            console.log(`  ✅ ${art.title.substring(0, 35)}... (👍${art.votes})`);
          } catch (e) {
            console.log(`  ⚠️ 插入失败`);
          }
        }
        
      } catch (error) {
        console.log(`  ⚠️ 搜索失败: ${error.message.substring(0, 50)}`);
      }
      
      await new Promise(r => setTimeout(r, 3000));
    }
    
    await browser.close();
    
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
  }
  
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log(`\n🎉 完成！共添加 ${totalScraped} 篇高赞知乎文章`);
}

scrapeZhihuWithLoggedInChrome().catch(console.error);
