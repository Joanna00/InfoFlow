/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Article } from '../types.js';
import { Search, Compass, Star, StarOff, ThumbsUp, Sparkles, Filter, Link, Plus, Calendar, StarHalf, FileSpreadsheet } from 'lucide-react';

interface ContentFeedProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onToggleFavorite: (id: string) => Promise<void>;
  onToggleLike: (id: string) => Promise<void>;
  onCrawlArticle: (url: string, sourceType: string, category: string) => Promise<void>;
  crawlLoading: boolean;
}

export default function ContentFeed({
  articles,
  onSelectArticle,
  onToggleFavorite,
  onToggleLike,
  onCrawlArticle,
  crawlLoading,
}: ContentFeedProps) {
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlType, setCrawlType] = useState<Article['source_type']>('website');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'hot'>('newest');
  const [searchWord, setSearchWord] = useState('');

  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl.trim()) return;

    try {
      await onCrawlArticle(crawlUrl, crawlType, '极速采集分类');
      setCrawlUrl('');
      alert('恭喜，自主采集中心已成功模拟抓取该文章段落、代码和结构，并在后台合并 AI 分析节点！');
    } catch (e: any) {
      console.error(e);
      alert('采集模拟失败：' + (e.message || '网络拥堵'));
    }
  };

  const getSourceBadgeColor = (type: Article['source_type']) => {
    switch (type) {
      case 'x':
        return 'bg-black text-white';
      case 'wechat':
        return 'bg-emerald-55 text-emerald-900 border border-emerald-250';
      case 'rss':
        return 'bg-orange-50 text-orange-850 border border-orange-250';
      case 'website':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'keyword':
        return 'bg-rose-50 text-rose-850 border border-rose-200';
    }
  };

  const getSourceTypeLabel = (type: Article['source_type']) => {
    switch (type) {
      case 'x':
        return 'X (Twitter)';
      case 'wechat':
        return '公众号';
      case 'rss':
        return 'RSS Feed';
      case 'website':
        return '网站抓取';
      case 'keyword':
        return '热词监控';
    }
  };

  // Internal Filter & Sort implementation
  const filteredArticles = articles
    .filter((a) => {
      // Type filter
      if (filterType !== 'all' && a.source_type !== filterType) {
        return false;
      }
      // Content Search filter
      if (searchWord.trim()) {
        const query = searchWord.toLowerCase();
        return (
          a.title.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query)) ||
          a.author.toLowerCase().includes(query) ||
          a.source.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.publish_time).getTime() - new Date(a.publish_time).getTime();
      }
      if (sortBy === 'rating') {
        return b.ai_score - a.ai_score;
      }
      if (sortBy === 'hot') {
        return b.ai_score + (b.is_liked ? 15 : 0) - (a.ai_score + (a.is_liked ? 15 : 0));
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Simulation Crawler Input Box */}
      <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-gray-100">
          <Compass className="w-5 h-5 text-gray-800" />
          <h2 className="text-sm font-semibold text-gray-900">自助信息模拟抓取 & 实时采集中心</h2>
        </div>

        <form onSubmit={handleCrawlSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-1.5 shrink-0">
            <select
              className="text-xs font-semibold px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-250 rounded-xl outline-none transition-colors cursor-pointer"
              value={crawlType}
              onChange={(e) => setCrawlType(e.target.value as Article['source_type'])}
            >
              <option value="website">💻 网页抓取</option>
              <option value="wechat">🟢 微信公众号</option>
              <option value="rss">🧡 RSS 采集</option>
              <option value="x">🐦 X 平台</option>
              <option value="keyword">🔍 关键词监控</option>
            </select>
          </div>

          <div className="relative flex-1">
            <Link className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              required
              placeholder={
                crawlType === 'x'
                  ? "@sama 或具体的推特微博链接..."
                  : crawlType === 'wechat'
                  ? "输入目标微信公众号名字..."
                  : crawlType === 'keyword'
                  ? "输入需要触发实时全网监测的冷词..."
                  : "粘贴网页/新闻文章/行业研究 URL 地址..."
              }
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-gray-250 bg-gray-50/50 rounded-xl outline-none focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 transition-colors"
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              disabled={crawlLoading}
            />
          </div>

          <button
            type="submit"
            disabled={crawlLoading}
            className="bg-gray-900 hover:bg-black text-white text-xs font-semibold py-2.5 px-5 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center justify-center space-x-1 shrink-0 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>{crawlLoading ? '正在采集并拼装AI脑暴中...' : '极速一键采集'}</span>
          </button>
        </form>
      </div>

      {/* Control Toolbar filters & sorting */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50 border border-gray-200/60 p-4 rounded-xl text-xs">
        {/* Type filters */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {['all', 'rss', 'website', 'x', 'wechat', 'keyword'].map((opt) => (
            <button
              key={opt}
              onClick={() => setFilterType(opt)}
              className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
                filterType === opt
                  ? 'bg-white border-gray-300 text-gray-900 shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {opt === 'all'
                ? '全部'
                : opt === 'wechat'
                ? '微信'
                : opt === 'keyword'
                ? '监控'
                : opt.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="流内检索..."
              className="pl-8 pr-3 py-1.5 text-xs w-full border border-gray-250 bg-white rounded-lg outline-none"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
            />
          </div>

          {/* Sort selection */}
          <div className="flex items-center space-x-1 border border-gray-200 bg-white px-2.5 py-1.5 rounded-lg w-full sm:w-auto shrink-0 justify-between self-stretch">
            <span className="text-gray-400 font-medium">排序方式:</span>
            <select
              className="font-semibold bg-transparent outline-none cursor-pointer text-gray-800 ml-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">⏰ 最新入库</option>
              <option value="rating">💯 AI评星高分</option>
              <option value="hot">🔥 火热度大盘</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Stream Articles List layout */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white border border-gray-150 rounded-xl py-16 text-center shadow-sm">
          <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-gray-500">内容大厅没有匹配的数据要务</p>
          <p className="text-xs text-gray-400 mt-1">您可以通过上方极速采集入口即时生成一片前沿分析。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between border-t-2 hover:border-t-rose-500"
            >
              <div onClick={() => onSelectArticle(art)} className="cursor-pointer">
                {/* Image block thumbnail */}
                {art.images && art.images.length > 0 && (
                  <div className="h-[160px] overflow-hidden relative group">
                    <img
                      src={art.images[0]}
                      alt={art.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getSourceBadgeColor(art.source_type)}`}>
                        {getSourceTypeLabel(art.source_type)}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-extrabold font-mono text-gray-900 border border-white/20">
                      AI 评分: {art.ai_score}分
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span>来源: {art.source}</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(art.publish_time).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-rose-600 transition-colors">
                    {art.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                    {art.content}
                  </p>

                  {/* Tags */}
                  {art.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {art.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card toolbar */}
              <div className="p-4 border-t border-gray-100 bg-gray-55 flex items-center justify-between">
                <button
                  onClick={() => onSelectArticle(art)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  启动 AI 深度提炼与资产加工 →
                </button>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => onToggleFavorite(art.id)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      art.is_favorite
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white border-gray-200 text-gray-400 hover:text-gray-900'
                    }`}
                    title={art.is_favorite ? '移除收藏' : '收藏此篇文章'}
                  >
                    <Star className={`w-3.5 h-3.5 ${art.is_favorite ? 'fill-rose-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => onToggleLike(art.id)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      art.is_liked
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-white border-gray-200 text-gray-400 hover:text-gray-900'
                    }`}
                    title="点赞"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
