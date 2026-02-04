// scripts/scrape-zhihu-ws.js - 使用WebSocket连接爬取知乎
const puppeteer = require('puppeteer');
const http = require('http');
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

async function getChromeDebuggerUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const wsUrl = json.webSocketDebuggerUrl;
          resolve(wsUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function scrapeZhihu() {
  console.log(`🚀 开始爬取知乎高赞文章 (赞同 > ${VOTE_THRESHOLD})...\n`);
  
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  db.run("DELETE FROM blogs WHERE source='知乎文章'");
  
  let totalScraped = 0;
  
  try {
    // 获取WebSocket URL
    console.log('🔗 获取Chrome调试URL...');
    const wsUrl = await getChromeDebuggerUrl();
    console.log(`   WebSocket: ${wsUrl.substring(0, 60)}...`);
    
    const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl });
    console.log('   ✅ 已连接\n');
    
    const page = await browser.newPage();
    
    for (const keyword of AI_INFRA_KEYWORDS) {
      console.log(`🔍 搜索: "${keyword}"`);
      
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
          const links = document.querySelectorAll('a[href*="/p/"]');
          
          links.forEach(link => {
            const href = link.href;
            const title = link.textContent?.trim() || '';
            const parent = link.closest('div') || link.parentElement?.parentElement;
            
            if (href && title && title.length > 10 && href.includes('/p/')) {
              let votes = 0;
              const parentText = parent?.textContent || '';
              const voteMatch = parentText.match(/(\d{3,}(?:,\d{3})*)\s*(?:赞同|赞)/) ||
                              parentText.match(/👍[\s]*(\d{3,})/);
              if (voteMatch) {
                votes = parseInt(voteMatch[1].replace(/,/g, ''));
              }
              
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
        }, VOTE_THRESHOLD);
        
        console.log(`  📊 发现 ${articles.length} 篇高赞文章`);
        
        for (const art of articles) {
          db.run(`INSERT INTO blogs (title, url, author, organization, summary, published_date, tags, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [art.title, art.url, '知乎用户', '知乎', `高赞文章 (👍${art.votes})`, new Date().toISOString().split('T')[0], `ai-infra,${keyword}`, '知乎文章']);
          totalScraped++;
          console.log(`  ✅ ${art.title.substring(0, 35)}... (👍${art.votes})`);
        }
        
      } catch (error) {
        console.log(`  ⚠️ ${error.message.substring(0, 40)}`);
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

scrapeZhihu().catch(console.error);
