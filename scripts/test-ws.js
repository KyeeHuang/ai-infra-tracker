const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🔗 尝试连接Chrome...');
    const browser = await puppeteer.connect({
      browserWSEndpoint: process.argv[2]
    });
    console.log('✅ 已连接!');
    
    const pages = await browser.pages();
    console.log(`📄 打开的页面: ${pages.length}`);
    
    await browser.close();
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
  }
})();
