/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Article } from '../types.js';
import { BookOpen, FolderHeart, Tags, Star, BarChart3, HelpCircle, FileText, Search, Sparkles, BookMarked, LayoutGrid } from 'lucide-react';

interface KnowledgeBaseProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export default function KnowledgeBase({ articles, onSelectArticle }: KnowledgeBaseProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'categories' | 'tags' | 'cards'>('favorites');
  const [searchTerm, setSearchTerm] = useState('');
  const [semanticMode, setSemanticMode] = useState(false);

  // Group metrics
  const favorites = articles.filter((a) => a.is_favorite);
  const totalLikes = articles.filter((a) => a.is_liked).length;
  
  const tagsMap: Record<string, number> = {};
  const categoriesMap: Record<string, Article[]> = {};
  const conceptCards: { concept: string; background: string; origin: Article }[] = [];

  articles.forEach((a) => {
    // Tags map
    a.tags.forEach((tag) => {
      tagsMap[tag] = (tagsMap[tag] || 0) + 1;
    });

    // Categories group
    const cat = a.source_type;
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
    }
    categoriesMap[cat].push(a);

    // Concept flashcards
    if (a.knowledge_card) {
      conceptCards.push({
        concept: a.knowledge_card.concept,
        background: a.knowledge_card.background,
        origin: a,
      });
    }
  });

  const allTags = Object.keys(tagsMap).sort((a, b) => tagsMap[b] - tagsMap[a]);

  const searchFilter = (a: Article) => {
    const text = searchTerm.toLowerCase();
    if (!text) return true;

    // Simulate AI Semantic matching expansion
    if (semanticMode) {
      if (text.includes('agent') || text.includes('智能体')) {
        return a.title.toLowerCase().includes('agent') || a.tags.includes('AI Agent') || a.content.includes('Collaborative');
      }
      if (text.includes('cursor') || text.includes('ide') || text.includes('代码')) {
        return a.title.toLowerCase().includes('cursor') || a.tags.includes('Cursor') || a.content.includes('克隆');
      }
      if (text.includes('机会') || text.includes('创业') || text.includes('saas') || text.includes('商业')) {
        return a.ai_score >= 85 || a.tags.includes('SaaS') || a.tags.includes('创业机会');
      }
    }

    return (
      a.title.toLowerCase().includes(text) ||
      a.content.toLowerCase().includes(text) ||
      a.author.toLowerCase().includes(text) ||
      a.source.toLowerCase().includes(text) ||
      a.tags.some((t) => t.toLowerCase().includes(text))
    );
  };

  const getSourceTypeName = (type: Article['source_type']) => {
    switch (type) {
      case 'x':
        return 'Twitter';
      case 'wechat':
        return '微信公众号';
      case 'rss':
        return 'RSS Feed';
      case 'website':
        return '门户网站';
      case 'keyword':
        return '关键词监控';
    }
  };

  const currentTabRender = () => {
    switch (activeTab) {
      case 'favorites':
        const favsFiltered = favorites.filter(searchFilter);
        return (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">我的收藏库 ({favsFiltered.length})</h3>
            {favsFiltered.length === 0 ? (
              <div className="py-12 border border-dashed border-gray-200 rounded-xl text-center bg-gray-50/50">
                <BookMarked className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">收藏夹目前为空，或无匹配搜索结果</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favsFiltered.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className="border border-gray-150 p-4 rounded-xl hover:border-rose-200/60 bg-white shadow-xs cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-[150px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 text-[10px] text-gray-400 font-mono">
                        <span>{getSourceTypeName(art.source_type)} | {art.source}</span>
                        <div className="flex items-center space-x-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span>已沉淀</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug hover:text-rose-600 transition-colors">
                        {art.title}
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {art.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-medium">#{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            {Object.keys(categoriesMap).map((catKey) => {
              const catArticles = categoriesMap[catKey as Article['source_type']].filter(searchFilter);
              if (catArticles.length === 0) return null;
              return (
                <div key={catKey} className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-1.5 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded bg-rose-500" />
                    <span>{getSourceTypeName(catKey as Article['source_type'])} 数据源 ({catArticles.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catArticles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => onSelectArticle(art)}
                        className="bg-white border border-gray-150 rounded-xl p-4 hover:border-gray-300 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                      >
                        <h5 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-1">{art.title}</h5>
                        <p className="text-[10px] text-gray-400 font-mono">作者: {art.author} | 时间: {new Date(art.publish_time).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'tags':
        return (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">跨订阅源热词集市</h3>
            
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchTerm(tag)}
                  className={`px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all border cursor-pointer ${
                    searchTerm === tag
                      ? 'bg-rose-500 border-rose-600 text-white font-medium'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span>#{tag}</span>
                  <span className={`text-[10px] rounded px-1.5 py-0.5 ${searchTerm === tag ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {tagsMap[tag]}
                  </span>
                </button>
              ))}
            </div>

            {searchTerm && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">符合标签 <span className="font-semibold text-rose-600">#{searchTerm}</span> 的文章：</p>
                  <button onClick={() => setSearchTerm('')} className="text-[10px] text-gray-400 hover:text-gray-900 underline">清除匹配</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.filter((a) => a.tags.includes(searchTerm)).map((art) => (
                    <div
                      key={art.id}
                      onClick={() => onSelectArticle(art)}
                      className="bg-white border border-gray-150 rounded-xl p-4 hover:border-gray-300 transition-all cursor-pointer shadow-xs"
                    >
                      <h5 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-1">{art.title}</h5>
                      <p className="text-[10px] text-gray-400 font-mono">发布时间: {new Date(art.publish_time).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'cards':
        return (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
              AI 高保真资产：核心概念闪卡 ({conceptCards.length})
            </h3>

            {conceptCards.length === 0 ? (
              <div className="py-12 border border-dashed border-gray-200 rounded-xl text-center bg-gray-50/50">
                <LayoutGrid className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-gray-500">当前没有提起核心知识概念卡的文章</p>
                <p className="text-[10px] text-gray-400 mt-1">进入普通文章阅读页，点击“启动 AI 深度提炼”自动创建概念闪卡！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {conceptCards.map((card, cIdx) => (
                  <div
                    key={cIdx}
                    onClick={() => onSelectArticle(card.origin)}
                    className="bg-white border border-gray-150 hover:border-rose-200 p-5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[180px] border-l-4 border-l-rose-500"
                  >
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 tracking-tight leading-snug line-clamp-1">
                        {card.concept}
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-4 mt-2 mb-4 bg-gray-50/40 p-2.5 rounded border border-gray-100">
                        {card.background}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-2 shrink-0">
                      <span>源文献: {card.origin.source}</span>
                      <span className="font-semibold text-rose-600 hover:underline">查看细节 →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and stats bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Core metrics visual columns */}
        <div className="lg:col-span-1 bg-white border border-gray-150 rounded-xl p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="bg-rose-50 p-3 rounded-lg border border-rose-100/50 font-semibold shrink-0">
            <Star className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">收藏总数</p>
            <p className="text-xl font-extrabold text-gray-950 mt-1 leading-none">{favorites.length} <span className="text-xs font-mono text-gray-400">Items</span></p>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white border border-gray-150 rounded-xl p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 shrink-0">
            <Tags className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">热点标签数</p>
            <p className="text-xl font-extrabold text-gray-950 mt-1 leading-none">{allTags.length} <span className="text-xs text-gray-400 font-mono">Tags</span></p>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white border border-gray-150 rounded-xl p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-105 shrink-0">
            <LayoutGrid className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">概念资产卡</p>
            <p className="text-xl font-extrabold text-gray-950 mt-1 leading-none">{conceptCards.length} <span className="text-xs text-gray-400 font-mono">Cards</span></p>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white border border-gray-150 rounded-xl p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 shrink-0">
            <BarChart3 className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">采集总文献</p>
            <p className="text-xl font-extrabold text-gray-950 mt-1 leading-none">{articles.length} <span className="text-xs text-gray-400 font-mono">Docs</span></p>
          </div>
        </div>
      </div>

      {/* Structured asset filters and search form */}
      <div className="bg-white border border-gray-150 p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
        {/* Search tool block */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={semanticMode ? "【AI 语义搜索】输入创业计划、行业方向如: Cursor机会 / agent ..." : "输入关键词检索文章标题、正文或作者..."}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-gray-250 bg-gray-50/50 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 transition-all font-sans"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              setSemanticMode(!semanticMode);
              setSearchTerm('');
            }}
            className={`cursor-pointer px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center space-x-1.5 border ${
              semanticMode
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-55'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{semanticMode ? '切换为普通检索' : 'AI 语义搜索模糊推荐'}</span>
          </button>
        </div>

        {/* Tab switch control header */}
        <div className="flex flex-wrap border-b border-gray-100 gap-1.5 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-2 px-4 border-b-2 font-medium cursor-pointer transition-colors flex items-center space-x-1.5 ${
              activeTab === 'favorites'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>收藏要件箱 ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-4 border-b-2 font-medium cursor-pointer transition-colors flex items-center space-x-1.5 ${
              activeTab === 'categories'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>分类文件夹</span>
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            className={`py-2 px-4 border-b-2 font-medium cursor-pointer transition-colors flex items-center space-x-1.5 ${
              activeTab === 'tags'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <Tags className="w-3.5 h-3.5" />
            <span>标签集市</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`py-2 px-4 border-b-2 font-medium cursor-pointer transition-colors flex items-center space-x-1.5 ${
              activeTab === 'cards'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>AI概念闪卡库 ({conceptCards.length})</span>
          </button>
        </div>

        {/* Core view content slot */}
        <div className="pt-2">
          {currentTabRender()}
        </div>
      </div>
    </div>
  );
}
