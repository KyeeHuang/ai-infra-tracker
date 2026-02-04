// scripts/scrape-zhihu-blogs.js - 爬取知乎AI Infra高赞文章（改进版）
const puppeteer = require('puppeteer');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');
const VOTE_THRESHOLD = 200;

// 知乎专栏和话题链接
const ZHIHU_SOURCES = [
  { name: 'AI Infra', url: 'https://www.zhihu.com/topic/19590316/newest?page=1' },
  { name: '机器学习', url: 'https://www.zhihu.com/topic/19571750/newest?page=1' },
  { name: '深度学习', url: 'https://www.zhihu.com/topic/19582815/newest?page=1' },
  { name: '大语言模型', url: 'https://www.zhihu.com/topic/27081323/newest?page=1' },
  { name: 'GPU计算', url: 'https://www.zhihu.com/topic/20631794/newest?page=1' },
];

async function scrapeZhihuBlogs() {
  console.log(`🚀 开始爬取知乎高赞文章 (点赞 > ${VOTE_THRESHOLD})...\n`);
  
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
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36');
    
    for (const source of ZHIHU_SOURCES) {
      console.log(`\n📰 扫描: ${source.name} - ${source.url}`);
      
      try {
        await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));
        
        // 滚动加载更多内容
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await new Promise(r => setTimeout(r, 1500));
        }
        
        // 查找文章卡片
        const articles = await page.evaluate((threshold) => {
          const results = [];
          const cards = document.querySelectorAll('.TopicMainCard, .ContentItem, article, .zm-item');
          
          cards.forEach(card => {
            // 查找链接
            const link = card.querySelector('a[href*="/p/"]') || card.querySelector('a[href*="/zhuanlan/"]');
            const titleEl = card.querySelector('h2, .Title, .zm-item-title a, .ContentItem-title a');
            
            // 查找点赞数
            let votes = 0;
            const voteText = card.textContent.match(/(\d{3,})[\s]*赞/) || 
                           card.textContent.match(/(\d{3,})[\s]*赞同/) ||
                           card.textContent.match(/👍[\s]*(\d{3,})/);
            if (voteText) {
              votes = parseInt(voteText[1]);
            }
            
            if (link && titleEl && votes >= threshold) {
              const title = titleEl.textContent?.trim();
              const url = link.href;
              
              if (title && title.length > 10 && url.includes('/p/') && !results.find(r => r.url === url)) {
                results.push({ title: title.substring(0, 100), url, votes });
              }
            }
          });
          
          return results.sort((a, b) => b.votes - a.votes).slice(0, 15);
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
              `ai-infra,${source.name}`,
              '知乎文章'
            ]);
            totalScraped++;
            console.log(`  ✅ ${art.title.substring(0, 35)}... (👍${art.votes})`);
          } catch (e) {}
        }
        
      } catch (error) {
        console.log(`  ⚠️ 失败: ${error.message.substring(0, 50)}`);
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

scrapeZhihuBlogs().catch(console.error);
