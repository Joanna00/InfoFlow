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

// Setup dynamic fetch proxy to automatically append user configuration headers to backend requests
const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const provider = typeof window !== 'undefined' ? (localStorage.getItem('CUSTOM_AI_PROVIDER') || 'gemini') : 'gemini';
  const customKey = typeof window !== 'undefined' ? (localStorage.getItem('CUSTOM_GEMINI_API_KEY') || '') : '';
  const baseUrl = typeof window !== 'undefined' ? (localStorage.getItem('CUSTOM_AI_BASE_URL') || '') : '';
  const customModel = typeof window !== 'undefined' ? (localStorage.getItem('CUSTOM_AI_MODEL') || '') : '';

  const finalInit = { ...init };
  const headers = new Headers(finalInit.headers || {});
  
  headers.set('x-ai-provider', provider);
  if (customKey) {
    headers.set('x-ai-api-key', customKey.trim());
    headers.set('x-gemini-api-key', customKey.trim());
    headers.set('x-custom-api-key', customKey.trim());
  }
  if (baseUrl) {
    headers.set('x-ai-base-url', baseUrl.trim());
  }
  if (customModel) {
    headers.set('x-ai-model', customModel.trim());
  }
  
  finalInit.headers = headers;
  return window.fetch(input, finalInit);
};

export default function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [briefs, setBriefs] = useState<DailyReport[]>([]);
  const [activeTab, setActiveTab] = useState<'feeds' | 'briefings' | 'knowledge' | 'sources' | 'bot'>('feeds');

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [anchoredArticle, setAnchoredArticle] = useState<Article | null>(null);

  // Custom user Large Model configuration states
  const [customProvider, setCustomProvider] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('CUSTOM_AI_PROVIDER') || 'gemini';
    }
    return 'gemini';
  });
  const [customApiKey, setCustomApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('CUSTOM_GEMINI_API_KEY') || '';
    }
    return '';
  });
  const [customBaseUrl, setCustomBaseUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('CUSTOM_AI_BASE_URL') || '';
    }
    return '';
  });
  const [customModel, setCustomModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('CUSTOM_AI_MODEL') || '';
    }
    return '';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsProviderInput, setSettingsProviderInput] = useState(customProvider);
  const [settingsKeyInput, setSettingsKeyInput] = useState(customApiKey);
  const [settingsBaseUrlInput, setSettingsBaseUrlInput] = useState(customBaseUrl);
  const [settingsModelInput, setSettingsModelInput] = useState(customModel);

  // Sync settings input states when values change
  useEffect(() => {
    setSettingsProviderInput(customProvider);
    setSettingsKeyInput(customApiKey);
    setSettingsBaseUrlInput(customBaseUrl);
    setSettingsModelInput(customModel);
  }, [customProvider, customApiKey, customBaseUrl, customModel]);

  // Loading and Error global states
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingBriefs, setLoadingBriefs] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [crawlLoading, setCrawlLoading] = useState(false);

  // 1. Synchronize sources
  const fetchSources = async () => {
    try {
      const res = await apiFetch('/api/sources');
      const data = await res.json();
      setSources(data);
    } catch (e) {
      console.error('Sources sync failure: ', e);
    }
  };

  const handleAddSource = async (sourceData: { name: string; url: string; type: Source['type']; category: string; tags: string[] }) => {
    try {
      const res = await apiFetch('/api/sources', {
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
      const res = await apiFetch(`/api/sources/${id}`, {
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
      const res = await apiFetch(`/api/sources/${id}`, {
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
      const res = await apiFetch(`/api/sources/${id}/sync`, {
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
      const res = await apiFetch('/api/sources/sync-all', {
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
      const res = await apiFetch(`/api/articles?sortBy=${sortBy}`);
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
      const res = await apiFetch('/api/articles/toggle-favorite', {
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
      const res = await apiFetch('/api/articles/toggle-like', {
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
      const res = await apiFetch(`/api/articles/${id}/notes`, {
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
      const res = await apiFetch(`/api/articles/${id}/generate-ai`, {
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
      const res = await apiFetch('/api/articles/crawl', {
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
      const res = await apiFetch('/api/briefs');
      const data = await res.json();
      setBriefs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateReport = async () => {
    setLoadingBriefs(true);
    try {
      const res = await apiFetch('/api/briefs/generate', {
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
    const res = await apiFetch('/api/ai/chatbot', {
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
                息流 InfoFlow <span className="text-xs font-medium text-gray-400 font-mono">v1.0</span>
              </h1>
              <p className="text-[10px] text-gray-450 mt-1 uppercase tracking-widest font-mono">
                Knowledge Asset Acquisition & Refinement Station
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-2.5 text-xs bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
            >
              <Server className={`w-3.5 h-3.5 ${customApiKey ? 'text-rose-500' : 'text-emerald-500'}`} />
              <span className="text-slate-500 tracking-tight">
                大模型代理节点: <span className="font-bold text-slate-800">{customApiKey ? `${customProvider.toUpperCase()} (${customModel || '自定义'})` : '系统默认'}</span>
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${customApiKey ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            </button>

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

      {/* Dynamic API Configuration Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Network className="w-4 h-4 text-rose-500 animate-pulse" />
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  大模型底座 & 分布式代理配置
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-xl font-bold leading-none p-1.5 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                系统内置了对各类主流 LLM API (Gemini, OpenAI, 各种基于 DeepSeek 的兼容API) 的完美后端路由。您只需在下方完成参数指定：
              </p>

              <div className="space-y-4">
                {/* Provider select */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    服务提供商 (Model Provider)
                  </label>
                  <select
                    value={settingsProviderInput}
                    onChange={(e) => setSettingsProviderInput(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-gray-800"
                  >
                    <option value="gemini">Google Gemini API</option>
                    <option value="openai">OpenAI API 兼容系列</option>
                    <option value="deepseek">DeepSeek 官方 API</option>
                    <option value="other">自定义三方 OpenAI-compatible 端点</option>
                  </select>
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    API 访问秘钥 (API Secret Key)
                  </label>
                  <input
                    type="password"
                    placeholder="sk-xxx... / AIzaSy... (不填则默认读取后台自带环境变量)"
                    value={settingsKeyInput}
                    onChange={(e) => setSettingsKeyInput(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-gray-800"
                  />
                </div>

                {/* Custom Base URL */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    自定义 API 基础代理端点 (Base URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.deepseek.com/v1 等 (Gemini默认留空)"
                    value={settingsBaseUrlInput}
                    onChange={(e) => setSettingsBaseUrlInput(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-gray-800"
                  />
                </div>

                {/* Custom Model Name */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    指定调用的模型标识符 (Model Base Name)
                  </label>
                  <input
                    type="text"
                    placeholder="deepseek-chat / gpt-4o-mini / gemini-2.5-pro 等"
                    value={settingsModelInput}
                    onChange={(e) => setSettingsModelInput(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setSettingsProviderInput('gemini');
                  setSettingsKeyInput('');
                  setSettingsBaseUrlInput('');
                  setSettingsModelInput('');
                  localStorage.removeItem('CUSTOM_AI_PROVIDER');
                  localStorage.removeItem('CUSTOM_GEMINI_API_KEY');
                  localStorage.removeItem('CUSTOM_AI_BASE_URL');
                  localStorage.removeItem('CUSTOM_AI_MODEL');
                  setCustomProvider('gemini');
                  setCustomApiKey('');
                  setCustomBaseUrl('');
                  setCustomModel('');
                  setIsSettingsOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-150 transition-all cursor-pointer"
              >
                清除所有自定义设置
              </button>
              <button
                onClick={() => {
                  const prov = settingsProviderInput.trim() || 'gemini';
                  const key = settingsKeyInput.trim();
                  const url = settingsBaseUrlInput.trim();
                  const mod = settingsModelInput.trim();

                  localStorage.setItem('CUSTOM_AI_PROVIDER', prov);
                  setCustomProvider(prov);

                  if (key) {
                    localStorage.setItem('CUSTOM_GEMINI_API_KEY', key);
                    setCustomApiKey(key);
                  } else {
                    localStorage.removeItem('CUSTOM_GEMINI_API_KEY');
                    setCustomApiKey('');
                  }

                  if (url) {
                    localStorage.setItem('CUSTOM_AI_BASE_URL', url);
                    setCustomBaseUrl(url);
                  } else {
                    localStorage.removeItem('CUSTOM_AI_BASE_URL');
                    setCustomBaseUrl('');
                  }

                  if (mod) {
                    localStorage.setItem('CUSTOM_AI_MODEL', mod);
                    setCustomModel(mod);
                  } else {
                    localStorage.removeItem('CUSTOM_AI_MODEL');
                    setCustomModel('');
                  }
                  setIsSettingsOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all cursor-pointer"
              >
                确认并应用新代理
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer bar credits */}
      <footer className="bg-white border-t border-gray-150 py-4 px-6 text-center text-xs text-gray-400 select-none tracking-tight leading-none shrink-0">
        息流 InfoFlow @ 2026. Made with Google GenAI & React. All rights reserved.
      </footer>
    </div>
  );
}
