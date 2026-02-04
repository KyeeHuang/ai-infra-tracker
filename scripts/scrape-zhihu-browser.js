// scripts/scrape-zhihu-browser.js - 使用真实浏览器环境爬取
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeWithRealBrowser() {
  console.log('🌐 使用真实浏览器环境爬取知乎...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // 使用可见浏览器
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--allow-running-insecure-content',
      '--disable-same-origin'
    ]
  });
  
  const context = browser.defaultBrowserContext();
  const page = await browser.newPage();
  
  // 设置更真实的请求头
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': 'https://www.google.com/'
  });
  
  try {
    // 直接访问知乎热榜
    console.log('📰 访问知乎热榜...');
    await page.goto('https://www.zhihu.com/hot', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    
    // 获取页面内容
    const html = await page.content();
    console.log(`📄 页面长度: ${html.length} 字符`);
    
    // 检查是否需要登录
    if (html.includes('登录') && html.includes('注册')) {
      console.log('⚠️ 知乎要求登录才能查看内容');
      console.log('💡 请手动登录知乎后运行爬虫');
    }
    
    // 尝试查找文章链接
    const links = await page.evaluate(() => {
      const results = [];
      // 查找所有链接
      document.querySelectorAll('a').forEach(a => {
        const href = a.href;
        const text = a.textContent?.trim();
        if (href && text && href.includes('zhihu.com/p/') && text.length > 10) {
          results.push({ title: text.substring(0, 80), url: href });
        }
      });
      return results;
    });
    
    console.log(`\n🔗 发现 ${links.length} 个知乎文章链接`);
    
    // 去重
    const unique = [];
    const seen = new Set();
    links.forEach(l => {
      if (!seen.has(l.url) && l.url.includes('/p/')) {
        seen.add(l.url);
        unique.push(l);
      }
    });
    
    console.log(`去重后: ${unique.length} 个唯一链接\n`);
    
    // 显示前10个
    unique.slice(0, 10).forEach((l, i) => {
      console.log(`${i+1}. ${l.title.substring(0, 50)}...`);
      console.log(`   ${l.url}`);
    });
    
    // 保存
    if (unique.length > 0) {
      const outputPath = path.join(__dirname, '../data/zhihu-real-links.json');
      fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2));
      console.log(`\n📁 已保存到 ${outputPath}`);
    }
    
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
  }
  
  console.log('\n💡 提示: 如果需要真实数据，建议:');
  console.log('   1. 手动登录知乎');
  console.log('   2. 使用浏览器扩展获取链接');
  console.log('   3. 或从其他来源获取数据');
  
  // 保持浏览器打开以便手动操作
  console.log('\n🌐 浏览器已打开，请手动操作...');
  console.log('按 Ctrl+C 退出');
  
  // 等待用户中断
  await new Promise(() => {});
}

scrapeWithRealBrowser().catch(console.error);
