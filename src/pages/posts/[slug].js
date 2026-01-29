export default function Post({ post }) {
  if (!post) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, sans-serif', background: '#f8f9fa', minHeight: '100vh' }}>
        <a href="/" style={{ display: 'inline-block', marginBottom: '20px', color: '#667eea', textDecoration: 'none' }}>← 返回首页</a>
        <article style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2>文章不存在</h2>
        </article>
      </div>
    );
  }

  // 简单的Markdown渲染
  const renderContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    
    lines.forEach((line, i) => {
      if (line.startsWith('## ')) {
        elements.push(<h2 key={i} style={{ fontSize: '24px', marginTop: '30px', marginBottom: '15px', color: '#333' }}>{line.replace('## ', '')}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} style={{ fontSize: '20px', marginTop: '20px', marginBottom: '10px', color: '#444' }}>{line.replace('### ', '')}</h3>);
      } else if (line.startsWith('```')) {
        // 代码块开始，忽略这行
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        elements.push(<p key={i} style={{ marginBottom: '10px', lineHeight: '1.8', color: '#555' }}>{line}</p>);
      }
    });
    
    return elements;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, sans-serif', background: '#f8f9fa', minHeight: '100vh' }}>
      <a href="/" style={{ display: 'inline-block', marginBottom: '20px', color: '#667eea', textDecoration: 'none', fontSize: '14px' }}>
        ← 返回首页
      </a>
      
      <article style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#333' }}>{post.title}</h1>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', color: '#888', fontSize: '14px' }}>
          <span>📅 {post.date}</span>
          <span>⏱️ {post.readTime} 分钟</span>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          {post.tags.map(tag => (
            <span key={tag} style={{ display: 'inline-block', padding: '4px 12px', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)', borderRadius: '20px', fontSize: '12px', color: '#666', marginRight: '8px' }}>
              {tag}
            </span>
          ))}
        </div>
        
        <div style={{ lineHeight: '1.8', fontSize: '16px', color: '#333' }}>
          {renderContent(post.content)}
        </div>
      </article>
      
      <footer style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
        <p>© 2026 AI Infra Tracker</p>
      </footer>
    </div>
  );
}

export async function getStaticProps({ params }) {
  const posts = {
    'getting-started-with-nextjs': {
      title: 'Next.js 入门指南',
      date: '2026-01-28',
      readTime: 10,
      tags: ['Next.js', 'React', '前端'],
      content: `## 引言

Next.js 是一个基于 React 的全栈框架，由 Vercel 开发。它提供了服务端渲染、静态导出、文件系统路由等功能，是现代 React 开发的最佳选择。

## 主要特性

### 1. 混合渲染
Next.js 支持多种渲染方式：
- SSR (服务端渲染): 每次请求都渲染
- SSG (静态生成): 构建时渲染
- ISR (增量静态再生成): 后台定时更新

### 2. 文件系统路由
只需要在 pages 或 app 目录下创建文件，Next.js 会自动处理路由。

### 3. 丰富的 API
Next.js 14 提供了完整的 API 路由支持，可以轻松创建后端接口。

## 快速开始

\`\`\`bash
npx create-next-app@latest my-blog
cd my-blog
npm run dev
\`\`\`

## 总结

Next.js 让 React 开发变得更加简单和强大。`,
    },
    'ai-infra-tracker-project': {
      title: 'AI Infra Tracker 项目总结',
      date: '2026-01-27',
      readTime: 15,
      tags: ['AI', 'Next.js', '项目'],
      content: `## 项目概述

AI Infra Tracker 是一个追踪 AI 基础设施领域资源的网站，收集 GitHub 仓库、arXiv 论文、知乎高赞文章。

## 技术栈

- **前端**: Next.js 14 + React
- **数据库**: SQLite + sql.js
- **爬虫**: Puppeteer + Cheerio
- **部署**: Vercel

## 主要功能

1. **数据采集**: 自动从 GitHub、arXiv、知乎抓取资源
2. **搜索筛选**: 支持关键词搜索和话题筛选
3. **点赞删除**: 用户可以收藏喜欢的文章
4. **响应式设计**: 适配各种设备

## 部署方式

项目已部署在 Vercel，可以访问以下链接查看：
https://ai-infra-tracker.vercel.app

## 总结

这是一个完整的 AI 基础设施资源追踪解决方案。`,
    },
    'understanding-llm-inference': {
      title: 'LLM 推理优化技术解析',
      date: '2026-01-25',
      readTime: 20,
      tags: ['AI', 'LLM', '推理优化'],
      content: `## 引言

大语言模型（LLM）的推理优化是当前 AI 基础设施领域的热门话题。本文将介绍几种主要的优化技术。

## 核心优化技术

### 1. PagedAttention

vLLM 提出的 PagedAttention 技术，解决了传统 KV Cache 内存碎片化的问题。

### 2. Continuous Batching

相比静态批处理，Continuous Batching 可以显著提高 GPU 利用率。

### 3. TensorRT-LLM

NVIDIA 提供的推理优化框架，支持多种模型优化。

## 总结

这些技术让 LLM 推理变得更加高效和低成本。`,
    },
  };

  const post = posts[params.slug];

  return {
    props: {
      post: post || null,
    },
  };
}

export async function getStaticPaths() {
  const slugs = ['getting-started-with-nextjs', 'ai-infra-tracker-project', 'understanding-llm-inference'];
  
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: false,
  };
}
