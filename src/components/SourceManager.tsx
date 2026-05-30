/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Source } from '../types.js';
import { Plus, Trash2, CheckCircle2, AlertTriangle, FileText, Compass, ServerCrash, Share2, Sparkles, Filter, RefreshCw, Loader2 } from 'lucide-react';

interface SourceManagerProps {
  sources: Source[];
  onAddSource: (source: { name: string; url: string; type: Source['type']; category: string; tags: string[] }) => Promise<void>;
  onToggleStatus: (id: string, active: boolean) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
  onSyncSource?: (id: string) => Promise<void>;
  onSyncAllSources?: () => Promise<void>;
}

export default function SourceManager({ 
  sources, 
  onAddSource, 
  onToggleStatus, 
  onDeleteSource,
  onSyncSource,
  onSyncAllSources 
}: SourceManagerProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<Source['type']>('rss');
  const [category, setCategory] = useState('AI 核心技术');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const categories = ['AI 核心技术', '前沿研究', '行业创投', '独立开发', '厂商官方', '微型SaaS'];

  const getSourceTypeStyles = (type: Source['type']) => {
    switch (type) {
      case 'x':
        return { badge: 'bg-black text-white', label: 'X (Twitter)' };
      case 'wechat':
        return { badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: '微信公众号' };
      case 'rss':
        return { badge: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'RSS Feed' };
      case 'website':
        return { badge: 'bg-blue-50 text-blue-700 border border-blue-200', label: '门户网站' };
      case 'keyword':
        return { badge: 'bg-rose-50 text-rose-700 border border-rose-200', label: '关键词监控' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onAddSource({
        name,
        url,
        type,
        category,
        tags,
      });

      setName('');
      setUrl('');
      setTagsInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSources = filterType === 'all' 
    ? sources 
    : sources.filter((s) => s.type === filterType);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add Subscription Panel */}
      <div className="lg:col-span-1 bg-white border border-gray-150 rounded-xl p-6 shadow-sm h-fit">
        <div className="flex items-center space-x-2 pb-4 mb-5 border-b border-gray-100">
          <Compass className="w-5 h-5 text-gray-800" />
          <h2 className="text-base font-semibold text-gray-900">新增数据采集源</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">订阅源名称 *</label>
            <input
              type="text"
              required
              placeholder="例如: 机器之心 / @sama"
              className="w-full text-sm px-3.5 py-2 border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-gray-50/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">采集类型</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['rss', 'website', 'x', 'wechat', 'keyword'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    type === t
                      ? 'border-rose-500 bg-rose-50/40 text-rose-800 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{getSourceTypeStyles(t).label}</span>
                  {type === t && <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">订阅源地址 / 公众号名 / 关键词</label>
            <input
              type="text"
              placeholder={
                type === 'x'
                  ? '例如: https://x.com/sama'
                  : type === 'wechat'
                  ? '例如: 机器之心'
                  : type === 'keyword'
                  ? '请输入监控词，如: AI Agent'
                  : '例如: https://techcrunch.com/feed/'
              }
              className="w-full text-sm px-3.5 py-2 border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-gray-50/50"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">所属分类</label>
            <select
              className="w-full text-sm px-3.5 py-2 border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">自定义标签 (英文逗号分隔)</label>
            <input
              type="text"
              placeholder="例如: GPT-5, 机器人, 创业"
              className="w-full text-sm px-3.5 py-2 border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-gray-50/50"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gray-900 hover:bg-black text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? '添加中...' : '确认开启采集源'}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
          <div className="flex items-center space-x-2 text-rose-700">
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
            <h4 className="text-xs font-semibold">智慧自动监控与轮询原理</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            与传统需要一篇文章一篇文章硬拷链接的思路不同，本系统支持<strong>整渠道持续监控 (后者)</strong>：
          </p>
          <ul className="text-[11px] text-gray-500 space-y-1.5 pl-4 list-disc leading-relaxed">
            <li><strong>微信公众号账号</strong>：只需录入公众号名字（如《机器之心》），雷达便将其列入常态轮询列表进行跟踪。</li>
            <li><strong>X (Twitter) & RSS 账号</strong>：直接记录用户 ID 或订阅端点，每天自动拉取。</li>
            <li><strong>一键即刻捕获</strong>：在右侧活动渠道中，可随时点击一键扫描或单渠道 “🔄 即刻扫描/拉去最新文章” 来轮询并让 AI 假想/提取该公众号在过去 24 小时内发表的最硬干货！</li>
          </ul>
        </div>
      </div>

      {/* Sources Display List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 bg-gray-50 border border-gray-200/60 p-4 rounded-xl space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-700">类型过滤器:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['all', 'rss', 'website', 'x', 'wechat', 'keyword'].map((opt) => (
              <button
                key={opt}
                onClick={() => setFilterType(opt)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize border cursor-pointer ${
                  filterType === opt
                    ? 'bg-white border-gray-300 text-gray-900 font-medium shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {opt === 'all'
                  ? '显示全部'
                  : opt === 'wechat'
                  ? '公众号'
                  : opt === 'keyword'
                  ? '关键词监控'
                  : opt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                <span>活动中的采集渠道 ({filteredSources.length})</span>
                {syncSuccessMsg && (
                  <span className="text-[10px] sm:text-[11px] font-normal text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-lg animate-pulse whitespace-nowrap">
                    {syncSuccessMsg}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">绑定公众号及其他渠道，支持常态化的一键或定时监控轮询</p>
            </div>

            <div className="flex items-center space-x-2">
              {onSyncAllSources && (
                <button
                  type="button"
                  onClick={async () => {
                    if (syncingAll) return;
                    setSyncingAll(true);
                    setSyncSuccessMsg(null);
                    try {
                      await onSyncAllSources();
                      setSyncSuccessMsg('全网自动轮询完毕！已拉取最新');
                      setTimeout(() => setSyncSuccessMsg(null), 4000);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setSyncingAll(false);
                    }
                  }}
                  disabled={syncingAll}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  title="立刻启动系统级全订阅网后台检查线程，把这些账号在最近时间里发的东西捕获入库"
                >
                  {syncingAll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{syncingAll ? '智慧轮询中...' : '一键轮询全部渠道'}</span>
                </button>
              )}
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-mono shrink-0 hidden sm:inline">
                ACTIVE RADAR
              </span>
            </div>
          </div>

          {filteredSources.length === 0 ? (
            <div className="py-12 text-center">
              <ServerCrash className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">当前没有配置符合该类型过滤的采集源</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredSources.map((source) => {
                const styles = getSourceTypeStyles(source.type);
                return (
                  <div key={source.id} className="p-5 flex items-start justify-between hover:bg-gray-55 transition-colors">
                    <div className="space-y-2 max-w-[80%]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
                          {styles.label}
                        </span>

                        <span className="text-[11px] bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                          {source.category}
                        </span>

                        <div className="flex items-center space-x-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${source.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          <span className="text-[10px] text-gray-500">
                            {source.status === 'active' ? '正常轮询' : '静音挂起'}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-gray-900">{source.name}</h4>
                      
                      <p className="text-xs text-gray-400 font-mono select-all break-all">{source.url}</p>

                      {source.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {source.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-gray-100 text-gray-600 hover:text-gray-900 px-2 py-0.5 rounded transition-all"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {onSyncSource && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (syncingId !== null) return;
                            setSyncingId(source.id);
                            setSyncSuccessMsg(null);
                            try {
                              await onSyncSource(source.id);
                              setSyncSuccessMsg(`《${source.name}》最新内容已捕获`);
                              setTimeout(() => setSyncSuccessMsg(null), 4000);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setSyncingId(null);
                            }
                          }}
                          disabled={syncingId !== null || source.status !== 'active'}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            source.status === 'active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                          }`}
                          title={source.status === 'active' ? '🔄 立刻扫描轮询该公众号/自媒体的最新文章' : '该源已挂起，无法主动轮询'}
                        >
                          {syncingId === source.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-rose-500" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => onToggleStatus(source.id, source.status === 'active')}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          source.status === 'active'
                            ? 'bg-emerald-50 border-emerald-150 text-emerald-700 hover:bg-emerald-100/50'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                        title={source.status === 'active' ? '暂停此采集源' : '恢复此采集源'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('确认删除该采集节点吗？对应采集到的历史数据依然会在内容流中保留。')) {
                            onDeleteSource(source.id);
                          }
                        }}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 rounded-lg transition-all cursor-pointer"
                        title="删除采集源"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
