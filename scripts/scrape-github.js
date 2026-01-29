// scripts/scrape-github.js - 爬取 GitHub 仓库（安全的 token 使用）
const axios = require('axios');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/ai-infra-tracker.db');

// 从环境变量获取 GitHub Token（不会硬编码）
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const AI_INFRA_REPOS = [
  'vllm-project/vllm',
  'sgl-project/sglang',
  'NVIDIA/TensorRT-LLM',
  'deepseek-ai/DeepSeek-V3',
  'flash-attention/flash-attention',
  'hpcaitech/ColossalAI',
  'microsoft/DeepSpeed',
  'meta-llama/llama',
  'QwenLM/Qwen',
  'THUDM/ChatGLM3',
];

async function scrapeGithub() {
  console.log('🚀 开始爬取 GitHub 仓库...\n');
  
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  
  let added = 0;
  
  for (const repo of AI_INFRA_REPOS) {
    try {
      console.log(`📦 Fetching: ${repo}...`);
      
      // 安全的请求头配置
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Infra-Scraper'
      };
      
      // 只有环境变量中有 token 才添加
      if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      }
      
      const res = await axios.get(`https://api.github.com/repos/${repo}`, { 
        headers, 
        timeout: 15000 
      });
      
      const r = res.data;
      
      db.run(`
        INSERT OR IGNORE INTO repos 
        (name, full_name, description, url, stars, forks, open_issues, watchers, language, license, updated_at, topics)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        r.name,
        r.full_name,
        r.description,
        r.html_url,
        r.stargazers_count,
        r.forks_count,
        r.open_issues_count,
        r.watchers_count,
        r.language,
        r.license?.spdx_id || null,
        r.updated_at,
        (r.topics || []).join(',')
      ]);
      
      added++;
      console.log(`  ✅ ${r.full_name} (⭐ ${r.stargazers_count.toLocaleString()})`);
      
    } catch (error) {
      const status = error.response?.status;
      if (status === 403) {
        console.log(`  ⚠️ API 限制，请设置 GITHUB_TOKEN 环境变量`);
      } else if (status === 404) {
        console.log(`  ⚠️ 仓库不存在`);
      } else {
        console.log(`  ❌ ${status || error.message}`);
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
  
  console.log(`\n🎉 完成！共添加 ${added} 个仓库`);
}

scrapeGithub().catch(console.error);
