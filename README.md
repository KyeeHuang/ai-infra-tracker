# 🚀 AI Infra Tracker

AI 基础设施资源追踪网站，收集 GitHub 仓库、arXiv 论文、知乎高赞文章。

## 功能特性

### 🌐 网站功能
- 📦 **GitHub 仓库** - 展示 AI Infra 相关的高星项目
- 📄 **arXiv 论文** - 最新的 AI 论文
- 📰 **知乎文章** - 高赞技术文章
- 🔍 **搜索筛选** - 关键词搜索和话题筛选
- ❤️ **收藏功能** - 点赞喜欢的资源
- 📱 **响应式设计** - 适配各种设备
- 🚀 **Vercel 部署** - 免费托管

### 🔧 爬虫工具
- 📦 **GitHub 爬虫** - 自动采集高星项目
- 📄 **arXiv 爬虫** - 批量获取最新论文
- 📰 **知乎爬虫** - 抓取高赞文章（需Chrome）

## 技术栈

- **前端**: Next.js 14 + React
- **样式**: Tailwind CSS
- **数据库**: SQLite (sql.js)
- **爬虫**: Puppeteer + Cheerio
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

```bash
cd ai-infra-tracker
npm install
```

### 2. 本地运行

```bash
npm run dev
```

访问: http://localhost:3000

### 3. 数据爬取（本地）

```bash
# 初始化数据库
npm run db:init

# 爬取 GitHub 仓库
npm run scrape:github

# 爬取 arXiv 论文
npm run scrape:arxiv

# 爬取知乎文章（需要Chrome远程调试）
npm run scrape:zhihu

# 全部爬取
npm run scrape:all
```

### 4. 数据同步

```bash
# 将数据推送到 GitHub（用于Vercel部署）
npm run db:push

# 从 GitHub 获取数据
npm run db:pull
```

## 部署到 Vercel

### 方式1: GitHub 数据同步（推荐）

1. **本地爬取数据**
   ```bash
   npm run scrape:all
   npm run db:push  # 推送到 GitHub data/目录
   ```

2. **Vercel 部署**
   - Fork 本仓库到 GitHub
   - 在 Vercel 中导入项目
   - Vercel 会自动从 data/ 目录加载数据

### 方式2: 独立部署爬虫

```bash
# 爬虫项目（本地运行）
# 网站项目（Vercel部署）
# 使用 GitHub 作为数据中转
```

## 环境变量

```bash
# GitHub Token（避免API限制）
export GITHUB_TOKEN=your_github_token_here
```

## 目录结构

```
ai-infra-tracker/
├── src/
│   ├── pages/
│   │   ├── index.js          # 首页
│   │   ├── api/
│   │   │   ├── repos.js      # GitHub API
│   │   │   ├── papers.js     # arXiv API
│   │   │   └── blogs.js      # 博客 API
│   │   └── posts/
│   │       └── [slug].js     # 文章详情
│   └── styles/               # 样式
├── scripts/
│   ├── init-db.js           # 初始化数据库
│   ├── scrape-github.js     # GitHub 爬虫
│   ├── scrape-arxiv.js      # arXiv 爬虫
│   ├── scrape-zhihu.js      # 知乎爬虫
│   ├── scrape-all.js        # 整合爬虫
│   ├── push-data.js         # 推送到GitHub
│   └── pull-data.js         # 从GitHub获取
├── data/                     # 数据库文件
├── public/                   # 静态资源
├── package.json
└── README.md
```

## GitHub 仓库

- **主项目**: https://github.com/KyeeHuang/ai-infra-tracker
- **在线演示**: https://ai-infra-tracker.vercel.app

## License

MIT
