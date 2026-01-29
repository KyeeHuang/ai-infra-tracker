import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

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
  excerpt: { fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '15px' },
  meta: { display: 'flex', gap: '15px', fontSize: '13px', color: '#888', marginBottom: '15px' },
  tag: { display: 'inline-block', padding: '4px 12px', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)', borderRadius: '20px', fontSize: '12px', color: '#666', marginRight: '8px' },
  readMore: { display: 'inline-block', padding: '10px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' },
  footer: { textAlign: 'center', padding: '40px 20px', color: '#888', marginTop: '40px' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '24px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e0e0e0' },
  repoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' },
  repoCard: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  repoTitle: { fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' },
  repoDesc: { fontSize: '13px', color: '#666', marginBottom: '10px', lineHeight: '1.5' },
  repoStats: { display: 'flex', gap: '15px', fontSize: '12px', color: '#888', marginTop: '10px' },
  repoStat: { display: 'flex', alignItems: 'center', gap: '4px' },
  paperCard: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  paperTitle: { fontSize: '15px', marginBottom: '8px', lineHeight: '1.4' },
  paperMeta: { fontSize: '12px', color: '#888', marginBottom: '8px' },
  paperAbstract: { fontSize: '13px', color: '#666', marginBottom: '10px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#888' },
};

export default function Home({ repos, papers }) {
  const [activeTab, setActiveTab] = useState('repos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRepos = repos.filter(repo => 
    repo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPapers = papers.filter(paper => 
    paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.authors?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.categories?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <Head>
        <title>AI Infra Tracker - AI 基础设施资源追踪</title>
        <meta name="description" content="追踪 AI 基础设施领域的最新资源：GitHub 仓库、arXiv 论文、技术文章" />
      </Head>

      <header style={styles.header}>
        <h1 style={styles.title}>🚀 AI Infra Tracker</h1>
        <p style={styles.subtitle}>GitHub 高星项目 | arXiv 论文 | 技术文章</p>

        <nav style={styles.nav}>
          <button style={activeTab === 'repos' ? styles.navButtonActive : styles.navButton} onClick={() => setActiveTab('repos')}>
            📦 仓库 ({repos.length})
          </button>
          <button style={activeTab === 'papers' ? styles.navButtonActive : styles.navButton} onClick={() => setActiveTab('papers')}>
            📄 论文 ({papers.length})
          </button>
        </nav>
      </header>

      <div style={styles.searchWrapper}>
        <input
          type="text"
          placeholder={activeTab === 'repos' ? "搜索仓库..." : "搜索论文..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {activeTab === 'repos' && (
        <main>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>📦 GitHub 高星项目</h2>
            {filteredRepos.length === 0 ? (
              <div style={styles.emptyState}>没有找到匹配的仓库</div>
            ) : (
              <div style={styles.repoGrid}>
                {filteredRepos.map(repo => (
                  <div key={repo.full_name} style={styles.repoCard}>
                    <h3 style={styles.repoTitle}>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#667eea' }}>
                        {repo.full_name || repo.name}
                      </a>
                    </h3>
                    <p style={styles.repoDesc}>{repo.description || '暂无描述'}</p>
                    <div style={styles.repoStats}>
                      {repo.language && <span style={styles.repoStat}>💻 {repo.language}</span>}
                      {repo.stars !== undefined && <span style={styles.repoStat}>⭐ {repo.stars.toLocaleString()}</span>}
                      {repo.forks !== undefined && <span style={styles.repoStat}>🍴 {repo.forks.toLocaleString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {activeTab === 'papers' && (
        <main>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>📄 最新 arXiv 论文</h2>
            {filteredPapers.length === 0 ? (
              <div style={styles.emptyState}>没有找到匹配的论文</div>
            ) : (
              <div style={styles.repoGrid}>
                {filteredPapers.map((paper, idx) => (
                  <div key={idx} style={styles.paperCard}>
                    <h3 style={styles.paperTitle}>
                      <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#333' }}>
                        {paper.title}
                      </a>
                    </h3>
                    <p style={styles.paperMeta}>{paper.authors?.split(',')[0]?.trim() || 'Unknown'} • {paper.published_date || 'Unknown'}</p>
                    <p style={styles.paperAbstract}>{paper.abstract || '暂无摘要'}</p>
                    <div style={styles.repoStats}>
                      {paper.categories && <span style={styles.repoStat}>📁 {paper.categories}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      <footer style={styles.footer}>
        <p>🤖 Built with Next.js + Vercel</p>
        <p style={{ marginTop: '10px', fontSize: '13px' }}>© 2026 AI Infra Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}

export async function getStaticProps() {
  // 加载 GitHub 仓库数据
  let repos = [];
  try {
    const reposPath = path.join(process.cwd(), 'data/repos.json');
    if (fs.existsSync(reposPath)) {
      repos = JSON.parse(fs.readFileSync(reposPath, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading repos:', e);
  }

  // 加载 arXiv 论文数据
  let papers = [];
  try {
    const papersPath = path.join(process.cwd(), 'data/papers.json');
    if (fs.existsSync(papersPath)) {
      papers = JSON.parse(fs.readFileSync(papersPath, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading papers:', e);
  }

  // 按 stars 或日期排序
  repos = repos.sort((a, b) => (b.stars || 0) - (a.stars || 0));
  papers = papers.sort((a, b) => (b.published_date || '').localeCompare(a.published_date || ''));

  return {
    props: { repos, papers },
  };
}
