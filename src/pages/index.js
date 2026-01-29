import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  header: { textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  title: { fontSize: '36px', marginBottom: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: '16px', color: '#666', marginBottom: '20px' },
  nav: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' },
  navButton: { padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '8px', background: 'white', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  navButtonActive: { padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', cursor: 'pointer' },
  searchWrapper: { maxWidth: '600px', margin: '0 auto 20px', position: 'relative' },
  searchInput: { width: '100%', padding: '14px 20px', fontSize: '15px', border: '2px solid #e0e0e0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.2s' },
  cardTitle: { fontSize: '20px', marginBottom: '12px', lineHeight: '1.4' },
  cardTitle: { fontSize: '20px', marginBottom: '12px', lineHeight: '1.4' },
  excerpt: { fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '15px' },
  meta: { display: 'flex', gap: '15px', fontSize: '13px', color: '#888', marginBottom: '15px' },
  tag: { display: 'inline-block', padding: '4px 12px', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)', borderRadius: '20px', fontSize: '12px', color: '#666', marginRight: '8px' },
  readMore: { display: 'inline-block', padding: '10px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' },
  footer: { textAlign: 'center', padding: '40px 20px', color: '#888', marginTop: '40px' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '24px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e0e0e0' },
  projectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
  projectCard: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  projectTitle: { fontSize: '16px', marginBottom: '8px' },
  projectDesc: { fontSize: '13px', color: '#666', marginBottom: '10px' },
  projectStats: { display: 'flex', gap: '15px', fontSize: '12px', color: '#888' },
};

export default function Home({ posts, projects }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('blog');

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <Head>
        <title>AI Infra Tracker Blog - AI 基础设施技术博客</title>
        <meta name="description" content="个人技术博客，分享AI、编程、项目经验" />
      </Head>

      <header style={styles.header}>
        <h1 style={styles.title}>🚀 AI Infra Tracker Blog</h1>
        <p style={styles.subtitle}>技术笔记 | 项目分享 | 学习记录</p>
        
        <nav style={styles.nav}>
          <button style={activeTab === 'blog' ? styles.navButtonActive : styles.navButton} onClick={() => setActiveTab('blog')}>
            📝 博客文章
          </button>
          <button style={activeTab === 'projects' ? styles.navButtonActive : styles.navButton} onClick={() => setActiveTab('projects')}>
            💻 项目
          </button>
          <button style={activeTab === 'about' ? styles.navButtonActive : styles.navButton} onClick={() => setActiveTab('about')}>
            👤 关于
          </button>
        </nav>
      </header>

      <div style={styles.searchWrapper}>
        <input
          type="text"
          placeholder="搜索文章..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {activeTab === 'blog' && (
        <main>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>📝 最新文章</h2>
            <div style={styles.grid}>
              {filteredPosts.map(post => (
                <article key={post.slug} style={styles.card}>
                  <h3 style={styles.cardTitle}>
                    <Link href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                      {post.title}
                    </Link>
                  </h3>
                  <p style={styles.excerpt}>{post.excerpt}</p>
                  <div style={styles.meta}>
                    <span>📅 {post.date}</span>
                    <span>⏱️ {post.readTime} 分钟</span>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    {post.tags.map(tag => (
                      <span key={tag} style={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  <Link href={`/posts/${post.slug}`} style={styles.readMore}>
                    阅读全文 →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}

      {activeTab === 'projects' && (
        <main>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>💻 开源项目</h2>
            <div style={styles.projectGrid}>
              {projects.map(project => (
                <div key={project.name} style={styles.projectCard}>
                  <h3 style={styles.projectTitle}>
                    <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#667eea' }}>
                      {project.name}
                    </a>
                  </h3>
                  <p style={styles.projectDesc}>{project.description}</p>
                  <div style={styles.projectStats}>
                    <span>⭐ {project.stars}</span>
                    <span>🔤 {project.language}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {activeTab === 'about' && (
        <main>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>👤 关于我</h2>
            <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: 'white' }}>
                👨‍💻
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Kyee Huang - AI Infrastructure</h3>
              <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto 20px', lineHeight: '1.8' }}>
                全栈开发者，专注于 AI 基础设施、Web 开发和技术分享。
                这里是记录学习笔记、分享项目经验的地方。
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://github.com/kyeehuang" style={{ ...styles.readMore, background: '#333' }}>GitHub</a>
                <a href="https://twitter.com/kyeehuang" style={{ ...styles.readMore, background: '#1da1f2' }}>Twitter</a>
                <a href="mailto:kyee@example.com" style={{ ...styles.readMore, background: '#666' }}>Email</a>
              </div>
            </div>
          </section>
        </main>
      )}

      <footer style={styles.footer}>
        <p>🤖 Built with Next.js + Vercel</p>
        <p style={{ marginTop: '10px', fontSize: '13px' }}>© 2026 AI Infra Tracker Blog. All rights reserved.</p>
      </footer>
    </div>
  );
}

export async function getStaticProps() {
  // 示例文章数据
  const posts = [
    {
      slug: 'getting-started-with-nextjs',
      title: 'Next.js 入门指南',
      excerpt: '从零开始学习 Next.js 14，包括项目搭建、路由配置、静态导出等核心功能。',
      date: '2026-01-28',
      readTime: 10,
      tags: ['Next.js', 'React', '前端'],
    },
    {
      slug: 'ai-infra-tracker-project',
      title: 'AI Infra Tracker 项目总结',
      excerpt: '分享如何构建一个 AI 基础设施资源追踪网站，包括数据爬取、Next.js 前端、Vercel 部署等。',
      date: '2026-01-27',
      readTime: 15,
      tags: ['AI', 'Next.js', '项目'],
    },
    {
      slug: 'understanding-llm-inference',
      title: 'LLM 推理优化技术解析',
      excerpt: '深入了解 vLLM、PagedAttention、Continuous Batching 等 LLM 推理优化技术。',
      date: '2026-01-25',
      readTime: 20,
      tags: ['AI', 'LLM', '推理优化'],
    },
  ];

  // 示例项目数据
  const projects = [
    {
      name: 'AI Infra Tracker',
      description: 'AI 基础设施资源追踪网站，收集 GitHub、arXiv、知乎的优质资源。',
      url: 'https://github.com/kyeehuang/ai-infra-tracker',
      stars: 12,
      language: 'JavaScript',
    },
    {
      name: 'Personal Blog',
      description: '基于 Next.js 的个人技术博客，支持文章管理、项目展示。',
      url: 'https://github.com/kyeehuang/personal-blog',
      stars: 5,
      language: 'TypeScript',
    },
  ];

  return {
    props: { posts, projects },
  };
}
