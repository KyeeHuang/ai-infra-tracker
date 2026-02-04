// scripts/scrape-zhihu-verify.js - 验证并获取真实知乎链接
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function verifyAndGetRealLinks() {
  console.log('🔗 验证知乎文章链接...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  
  // 尝试直接访问知乎首页和搜索页
  const verifiedArticles = [];
  
  // 方法1: 访问知乎首页
  try {
    console.log('🌐 访问知乎首页...');
    await page.goto('https://www.zhihu.com', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // 搜索特定关键词
    const keywords = ['vLLM', 'FlashAttention', 'DeepSeek', '推理优化'];
    
    for (const keyword of keywords) {
      console.log(`\n🔍 搜索: "${keyword}"`);
      
      // 在搜索框中输入关键词
      const searchInput = await page.$('input[placeholder*="搜索"]');
      if (searchInput) {
        await searchInput.click();
        await page.keyboard.type(keyword);
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 3000));
        
        // 提取搜索结果中的链接
        const links = await page.evaluate(() => {
          const results = [];
          const elements = document.querySelectorAll('a[href*="/p/"]');
          elements.forEach(a => {
            const href = a.href;
            const title = a.textContent?.trim();
            if (href && title && title.length > 5 && href.includes('/p/')) {
              results.push({ url: href, title });
            }
          });
          return results;
        });
        
        console.log(`  发现 ${links.length} 个链接`);
        
        for (const link of links.slice(0, 5)) {
          if (!verifiedArticles.find(a => a.url === link.url)) {
            verifiedArticles.push(link);
          }
        }
        
        // 返回首页
        await page.goto('https://www.zhihu.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  } catch (e) {
    console.log(`  ⚠️ ${e.message.substring(0, 50)}`);
  }
  
  await browser.close();
  
  console.log(`\n✅ 共获取 ${verifiedArticles.length} 个真实链接`);
  
  if (verifiedArticles.length > 0) {
    console.log('\n真实链接：');
    verifiedArticles.slice(0, 10).forEach((a, i) => {
      console.log(`${i+1}. ${a.title?.substring(0, 50)}`);
      console.log(`   ${a.url}`);
    });
    
    // 保存到文件
    const outputPath = path.join(__dirname, '../data/verified-zhihu-links.json');
    fs.writeFileSync(outputPath, JSON.stringify(verifiedArticles, null, 2));
    console.log(`\n📁 已保存到 ${outputPath}`);
  } else {
    console.log('\n⚠️ 未能获取到真实链接');
  }
}

verifyAndGetRealLinks().catch(console.error);
