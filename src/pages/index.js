import { useState, useEffect } from 'react';
import Head from 'next/head';
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
  repoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill', minmax: '320px', gap: '15px' },
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
  blogCard: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  blogTitle: { fontSize: '16px', marginBottom: '8px', lineHeight: '1.4' },
  blogMeta: { fontSize: '12px', color: '#888', marginBottom: '8px' },
  blogExcerpt: { fontSize: '13px', color: '#666', marginBottom: '10px', lineHeight: '1.5' },
  loading: { textAlign: 'center', padding: '40px', color: '#888' },
  tag: { display: 'inline-block', padding: '4px 12px', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)', borderRadius: '20px', fontSize: '12px', color: '#666', marginRight: '8px' },
  footer: { textAlign: 'center', padding: '40px 20px', color: '#888', marginTop: '40px' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '24px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e0e0e0' },
  cacheInfo: { fontSize: '11px', color: '#aaa', marginLeft: '8px' },
};

const TARGET_REPOS = [
  'vllm-project/vllm', 'sgl-project/sglang', 'NVIDIA/TensorRT-LLM',
  'deepseek-ai/DeepSeek-V3', 'hpcaitech/ColossalAI', 'microsoft/DeepSpeed',
  'meta-llama/llama', 'QwenLM/Qwen', 'THUDM/ChatGLM3'
];

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存

function getCachedData(key) {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {}
  return null;
}

function setCachedData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {}
}

export default function Home({ repos, papers, blogs }) {
  const [activeTab, setActiveTab] = useState('repos');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientRepos, setClientRepos] = useState([]);
  const [clientPapers, setClientPapers] = useState([]);
  const [loading, setLoading] = useState({ repos: false, papers: false });
  const [fromCache, setFromCache] = useState({ repos: false, papers: false });

  // 初始化时检查缓存
  useEffect(() => {
    const cachedRepos = getCachedData('ai-infra-repos');
    const cachedPapers = getCachedData('ai-infra-papers');
    
    if (cachedRepos) {
      setClientRepos(cachedRepos);
      setFromCache(prev => ({ ...prev, repos: true }));
    } else {
      setClientRepos(repos);
    }
    
    if (cachedPapers) {
      setClientPapers(cachedPapers);
      setFromCache(prev => ({ ...prev, papers: true }));
    } else {
      setClientPapers(papers);
    }
  }, [repos, papers]);

  // 加载 GitHub 数据（带缓存）
  const loadGitHubData = async () => {
    const cached = getCachedData('ai-infra-repos');
    if (cached && clientRepos.length > 0) return;
    
    setLoading(prev => ({ ...prev, repos: true }));
    try {
      const newRepos = [];
      for (const repo of TARGET_REPOS) {
        try {
          const res = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
          });
          if (res.ok) {
            const data = await res.json();
            newRepos.push({
              name: data.name,
              full_name: data.full_name,
              description: data.description,
              url: data.html_url,
              stars: data.stargazers_count,
              forks: data.forks_count,
              language: data.language,
            });
          }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 500));
      }
      setClientRepos(newRepos);
      setCachedData('ai-infra-repos', newRepos);
      setFromCache(prev => ({ ...prev, repos: false }));
    } catch (e) {
      console.error('Error loading repos:', e);
    }
    setLoading(prev => ({ ...prev, repos: false }));
  };

  // 加载 arXiv 数据（带缓存）
  const loadArxivData = async () => {
    const cached = getCachedData('ai-infra-papers');
    if (cached && clientPapers.length > 0) return;
    
    setLoading(prev => ({ ...prev, papers: true }));
    try {
      const categories = ['cs.AI', 'cs.LG', 'cs.DC'];
      let allPapers = [];
      
      for (const cat of categories) {
        const res = await fetch(
          `https://export.arxiv.org/api/query?search_query=cat:${cat}&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending`
        );
        const text = await res.text();
        const entries = text.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
        
        for (const entry of entries) {
          const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '';
          const pdfUrl = entry.match(/<link href="(https:\/\/arxiv\.org\/pdf\/[^"]+)"/)?.[1] || '';
          const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || '';
          const authors = (entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/g) || [])
            .map(a => a.match(/<name>([\s\S]*?)<\/name>/)?.[1]).filter(Boolean).join(', ');
          const abstract = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || '';
          
          if (title && pdfUrl) {
            allPapers.push({ title, pdf_url: pdfUrl, published_date: published?.split('T')[0], authors, abstract, categories: cat });
          }
        }
      }
      const slicedPapers = allPapers.slice(0, 50);
      setClientPapers(slicedPapers);
      setCachedData('ai-infra-papers', slicedPapers);
      setFromCache(prev => ({ ...prev, papers: false }));
    } catch (e) {
      console.error('Error loading papers:', e);
    }
    setLoading(prev => ({ ...prev, papers: false }));
  };

  const filteredRepos = clientRepos.filter(repo => 
    repo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPapers = clientPapers.filter(paper => 
    paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.authors?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBlogs = (blogs || []).filter(blog =>
    blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={styles.container}>
      <Head>
        <title>AI Infra Tracker - AI 基础设施资源追踪</title>
        <meta name="description" content="追踪 AI 基础设施领域的最新资源：GitHub 仓库、arXiv 论文、技术文章" />
      </Head>

      <header style={styles.header}>
        <h1 style={styles.title}>🚀 AI Infra Tracker</h1>
        <p style={styles.subtitle}>GitHub 实时数据 | arXiv 最新论文 | 精选技术博客</p>

        <nav style={styles.nav}>
          <button style={activeTab === 'repos' ? styles.navButtonActive : styles.navButton} onClick={() => { setActiveTab('repos'); loadGitHubData(); }}>
            📦 仓库 {loading.repos ? '(加载中...)' : `(${clientRepos.length})`}
            {fromCache.repos && <span style={styles.cacheInfo}>(缓存)</span>}
          </button>
          <button style={activeTab === 'papers' ? styles.navButtonActive : styles.navButton} onClick={() => { setActiveTab('papers'); loadArxivData(); }}>
            📄 论文 {loading.papers ? '(加载中...)' : `(${clientPapers.length})`}
            {fromCache.papers && <span style={styles.cacheInfo}>(缓存)</span>}
          </button>
          <button style={activeTab === 'blogs' ? styles.navButtonActive : styles.navButton} onClick={() => setActiveTab('blogs')}>
            📰 博客 ({(blogs || []).length})
          </button>
        </nav>
      </header>

      <div style={styles.searchWrapper}>
        <input
          type="text"
          placeholder={activeTab === 'repos' ? "搜索仓库..." : activeTab === 'papers' ? "搜索论文..." : "搜索博客..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {activeTab === 'repos' && (
        <main>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              📦 GitHub 高星项目 
              {fromCache.repos && clientRepos.length > 0 && <span style={styles.cacheInfo}>(24h缓存)</span>}
            </h2>
            {loading.repos ? (
              <div style={styles.loading}>🔄 正在从 GitHub 获取数据...</div>
            ) : filteredRepos.length === 0 ? (
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
                      <span style={styles.repoStat}>⭐ {repo.stars?.toLocaleString()}</span>
                      <span style={styles.repoStat}>🍴 {repo.forks?.toLocaleString()}</span>
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
            <h2 style={styles.sectionTitle}>
              📄 最新 arXiv 论文
              {fromCache.papers && clientPapers.length > 0 && <span style={styles.cacheInfo}>(24h缓存)</span>}
            </h2>
            {loading.papers ? (
              <div style={styles.loading}>🔄 正在从 arXiv 获取数据...</div>
            ) : filteredPapers.length === 0 ? (
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
                    <p style={styles.paperMeta}>{paper.authors?.split(',')[0]?.trim() || 'Unknown'} • {paper.published_date}</p>
                    <p style={styles.paperAbstract}>{paper.abstract || '暂无摘要'}</p>
                    <div style={styles.repoStats}>
                      <span style={styles.tag}>{paper.categories}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {activeTab === 'blogs' && (
        <main>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>📰 精选技术博客</h2>
            <div style={styles.repoGrid}>
              {filteredBlogs.map((blog, idx) => (
                <div key={idx} style={styles.blogCard}>
                  <h3 style={styles.blogTitle}>
                    <a href={blog.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#333' }}>
                      {blog.title}
                    </a>
                  </h3>
                  <p style={styles.blogMeta}>{blog.author} • {blog.organization} • {blog.published_date}</p>
                  <p style={styles.blogExcerpt}>{blog.excerpt}</p>
                  <div style={styles.repoStats}>
                    {blog.tags.map(tag => <span key={tag} style={styles.tag}>{tag}</span>)}
                    <span style={styles.repoStat}>👍 {blog.votes?.toLocaleString() || 0}</span>
                    <span style={styles.repoStat}>📰 {blog.source}</span>
                  </div>
                </div>
              ))}
            </div>
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
  // 预加载 GitHub 数据
  let repos = [];
  try {
    for (const repo of TARGET_REPOS) {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
          const data = await res.json();
          repos.push({
            name: data.name,
            full_name: data.full_name,
            description: data.description,
            url: data.html_url,
            stars: data.stargazers_count,
            forks: data.forks_count,
            language: data.language,
          });
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (e) {
    console.error('Error loading repos:', e);
  }

  // 预加载 arXiv 数据
  let papers = [];
  try {
    const categories = ['cs.AI', 'cs.LG', 'cs.DC'];
    for (const cat of categories) {
      const res = await fetch(
        `https://export.arxiv.org/api/query?search_query=cat:${cat}&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending`
      );
      const text = await res.text();
      const entries = text.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
      
      for (const entry of entries.slice(0, 15)) {
        const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '';
        const pdfUrl = entry.match(/<link href="(https:\/\/arxiv\.org\/pdf\/[^"]+)"/)?.[1] || '';
        const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || '';
        const authors = (entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/g) || [])
          .map(a => a.match(/<name>([\s\S]*?)<\/name>/)?.[1]).filter(Boolean).join(', ');
        const abstract = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || '';
        
        if (title && pdfUrl) {
          papers.push({ title, pdf_url: pdfUrl, published_date: published?.split('T')[0], authors, abstract, categories: cat });
        }
      }
    }
  } catch (e) {
    console.error('Error loading papers:', e);
  }

  repos.sort((a, b) => b.stars - a.stars);
  papers = papers.slice(0, 50);

  // 加载博客数据
  let blogs = [];
  try {
    const blogsPath = path.join(process.cwd(), 'data/blogs.json');
    if (fs.existsSync(blogsPath)) {
      blogs = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading blogs:', e);
  }

  return {
    props: { repos, papers, blogs },
    revalidate: 172800,
  };
}
