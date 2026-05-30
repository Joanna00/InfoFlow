/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Source, Article, DailyReport, QAMessage } from './types.js';
import SourceManager from './components/SourceManager.js';
import ContentFeed from './components/ContentFeed.js';
import DailyBriefing from './components/DailyBriefing.js';
import KnowledgeBase from './components/KnowledgeBase.js';
import AIChatbot from './components/AIChatbot.js';
import ArticleReader from './components/ArticleReader.js';
import { Radio, Newspaper, Lightbulb, Compass, Database, Bot, Sparkles, Server, Network, User } from 'lucide-react';

export default function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [briefs, setBriefs] = useState<DailyReport[]>([]);
  const [activeTab, setActiveTab] = useState<'feeds' | 'briefings' | 'knowledge' | 'sources' | 'bot'>('feeds');

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [anchoredArticle, setAnchoredArticle] = useState<Article | null>(null);

  // Loading and Error global states
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingBriefs, setLoadingBriefs] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [crawlLoading, setCrawlLoading] = useState(false);

  // 1. Synchronize sources
  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      setSources(data);
    } catch (e) {
      console.error('Sources sync failure: ', e);
    }
  };

  const handleAddSource = async (sourceData: { name: string; url: string; type: Source['type']; category: string; tags: string[] }) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData),
      });
      if (res.ok) {
        await fetchSources();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSourceStatus = async (id: string, currentlyActive: boolean) => {
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentlyActive ? 'inactive' : 'active' }),
      });
      if (res.ok) {
        await fetchSources();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchSources();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncSource = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}/sync`, {
        method: 'POST',
      });
      if (res.ok) {
        await Promise.all([fetchSources(), fetchArticles()]);
      }
    } catch (e) {
      console.error('Single source sync failed:', e);
    }
  };

  const handleSyncAllSources = async () => {
    try {
      const res = await fetch('/api/sources/sync-all', {
        method: 'POST',
      });
      if (res.ok) {
        await Promise.all([fetchSources(), fetchArticles()]);
      }
    } catch (e) {
      console.error('All sources sync failed:', e);
    }
  };

  // 2. Synchronize articles
  const fetchArticles = async (sortBy: string = 'newest') => {
    setLoadingArticles(true);
    try {
      const res = await fetch(`/api/articles?sortBy=${sortBy}`);
      const data = await res.json();
      setArticles(data);

      // Keep active reader updated if currently open
      if (selectedArticle) {
        const fresh = data.find((a: Article) => a.id === selectedArticle.id);
        if (fresh) setSelectedArticle(fresh);
      }
    } catch (e) {
      console.error('Articles fetch failure: ', e);
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await fetch('/api/articles/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchArticles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      const res = await fetch('/api/articles/toggle-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchArticles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/articles/${id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        await fetchArticles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAI = async (id: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/articles/${id}/generate-ai`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '大模型网络通信故障');
      }
      await fetchArticles();
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCrawlArticle = async (url: string, sourceType: string, category: string) => {
    setCrawlLoading(true);
    try {
      const res = await fetch('/api/articles/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, source_type: sourceType, category_name: category }),
      });
      if (!res.ok) {
        throw new Error('Crawl operation failed on standard API');
      }
      await fetchArticles();
    } finally {
      setCrawlLoading(false);
    }
  };

  // 3. Briefings System Syncs
  const fetchBriefs = async () => {
    try {
      const res = await fetch('/api/briefs');
      const data = await res.json();
      setBriefs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateReport = async () => {
    setLoadingBriefs(true);
    try {
      const res = await fetch('/api/briefs/generate', {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '生成失败');
      }
      await fetchBriefs();
      alert('今日 AI 航向与新商业机会简报已生成就绪，请阅读下栏面板。');
    } catch (e: any) {
      alert(e.message || '网络不稳定，生成简报失败');
    } finally {
      setLoadingBriefs(false);
    }
  };

  // 4. Chatbot processor
  const handleSendMessage = async (messages: QAMessage[]) => {
    const res = await fetch('/api/ai/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        selectedArticleId: anchoredArticle?.id,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '通信失败');
    }

    return res.json();
  };

  // Mount effects
  useEffect(() => {
    fetchSources();
    fetchArticles();
    fetchBriefs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-55/65 text-slate-800 flex flex-col font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* Global Brand Header */}
      <header className="bg-white border-b border-gray-150 py-3.5 px-6 shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-900 text-white rounded-xl p-2.5 shadow-md flex items-center justify-center border border-gray-800">
              <Radio className="w-5 h-5 animate-pulse text-rose-400" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-gray-950 tracking-tight leading-none">
                AI 信息雷达 <span className="text-xs font-medium text-gray-400 font-mono">MVP v1.0</span>
              </h1>
              <p className="text-[10px] text-gray-450 mt-1 uppercase tracking-widest font-mono">
                Knowledge Asset Acquisition & Refinement Station
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2.5 text-xs bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl">
              <Server className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-500 tracking-tight">大模型后台代理节点: <span className="font-bold text-slate-800">GEMINI_API_KEY</span></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            <div className="text-xs font-mono text-gray-400">
              UTC: 14:11:31
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-8">
        {/* Navigation Rail Left */}
        <aside className="md:w-64 shrink-0 space-y-4">
          <nav className="bg-white border border-gray-150 p-3 rounded-2xl shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab('feeds')}
              className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between font-medium cursor-pointer ${
                activeTab === 'feeds'
                  ? 'bg-rose-50/40 text-rose-800 font-bold border-l-4 border-l-rose-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Newspaper className="w-4 h-4 text-gray-400 shrink-0" />
                <span>📡 采集大厅 Feed</span>
              </div>
              <span className="text-[10px] bg-gray-150 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                {articles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('briefings')}
              className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between font-medium cursor-pointer ${
                activeTab === 'briefings'
                  ? 'bg-rose-50/40 text-rose-800 font-bold border-l-4 border-l-rose-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Lightbulb className="w-4 h-4 text-gray-400 shrink-0" />
                <span>📰 简报中心 Briefs</span>
              </div>
              <span className="text-[10px] bg-gray-150 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                {briefs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('knowledge')}
              className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between font-medium cursor-pointer ${
                activeTab === 'knowledge'
                  ? 'bg-rose-50/40 text-rose-800 font-bold border-l-4 border-l-rose-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-gray-400 shrink-0" />
                <span>🗄️ 知识库 Assets</span>
              </div>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono font-bold">
                {articles.filter((a) => a.is_favorite).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between font-medium cursor-pointer ${
                activeTab === 'sources'
                  ? 'bg-rose-50/40 text-rose-800 font-bold border-l-4 border-l-rose-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Compass className="w-4 h-4 text-gray-400 shrink-0" />
                <span>⚙️ 采集源 Subscriber</span>
              </div>
              <span className="text-[10px] bg-gray-150 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                {sources.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bot')}
              className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between font-medium cursor-pointer ${
                activeTab === 'bot'
                  ? 'bg-rose-50/40 text-rose-800 font-bold border-l-4 border-l-rose-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Bot className="w-4 h-4 text-gray-400 shrink-0 animate-bounce" />
                <span>💬 问答智能体 AI Chat</span>
              </div>
              <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                ASK
              </span>
            </button>
          </nav>

          {/* Quick instructions box warning */}
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 border border-slate-850 p-4 rounded-2xl shadow-md text-white space-y-3 relative overflow-hidden hidden md:block">
            <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12">
              <Sparkles className="w-24 h-24 text-rose-500" />
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-rose-400 font-bold tracking-wider">
              <Network className="w-3.5 h-3.5" />
              <span>知识资本沉淀法</span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              在这里，收藏的文章将全自动转化为可被语义检索、随时加工成新媒体选题、一键导出 Markdown 的永久个人知识资产。
            </p>
          </div>
        </aside>

        {/* Dynamic Display Panel Right */}
        <main className="flex-1 min-w-0">
          {activeTab === 'feeds' && (
            <ContentFeed
              articles={articles}
              onSelectArticle={(art) => setSelectedArticle(art)}
              onToggleFavorite={handleToggleFavorite}
              onToggleLike={handleToggleLike}
              onCrawlArticle={handleCrawlArticle}
              crawlLoading={crawlLoading}
            />
          )}

          {activeTab === 'briefings' && (
            <DailyBriefing
              reports={briefs}
              onGenerateReport={handleGenerateReport}
              loading={loadingBriefs}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeBase
              articles={articles}
              onSelectArticle={(art) => setSelectedArticle(art)}
            />
          )}

          {activeTab === 'sources' && (
            <SourceManager
              sources={sources}
              onAddSource={handleAddSource}
              onToggleStatus={handleToggleSourceStatus}
              onDeleteSource={handleDeleteSource}
              onSyncSource={handleSyncSource}
              onSyncAllSources={handleSyncAllSources}
            />
          )}

          {activeTab === 'bot' && (
            <AIChatbot
              onSendMessage={handleSendMessage}
              selectedArticleId={anchoredArticle?.id}
              selectedArticleTitle={anchoredArticle?.title}
              onClearSelectedArticle={() => setAnchoredArticle(null)}
            />
          )}
        </main>
      </div>

      {/* Pop up Article Fullscreen detail interface */}
      {selectedArticle && (
        <ArticleReader
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onToggleFavorite={handleToggleFavorite}
          onToggleLike={handleToggleLike}
          onSaveNotes={handleSaveNotes}
          onGenerateAI={handleGenerateAI}
          aiLoading={loadingAction}
          onAnchorArticle={(art) => {
            setAnchoredArticle(art);
            setActiveTab('bot');
            setSelectedArticle(null);
          }}
        />
      )}

      {/* Footer bar credits */}
      <footer className="bg-white border-t border-gray-150 py-4 px-6 text-center text-xs text-gray-400 select-none tracking-tight leading-none shrink-0">
        AI 信息雷达 @ 2026. Made with Google GenAI & React. All rights reserved.
      </footer>
    </div>
  );
}
