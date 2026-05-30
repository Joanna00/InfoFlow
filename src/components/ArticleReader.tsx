/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Article } from '../types.js';
import { X, Sparkles, BookMarked, ThumbsUp, Copy, Save, AlertCircle, FileText, Lightbulb, Compass, Target, Layers } from 'lucide-react';
import MarkdownViewer from './MarkdownViewer.js';

interface ArticleReaderProps {
  article: Article;
  onClose: () => void;
  onToggleFavorite: (id: string) => Promise<void>;
  onToggleLike: (id: string) => Promise<void>;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  onGenerateAI: (id: string) => Promise<void>;
  aiLoading: boolean;
  onAnchorArticle: (article: Article) => void;
}

export default function ArticleReader({
  article,
  onClose,
  onToggleFavorite,
  onToggleLike,
  onSaveNotes,
  onGenerateAI,
  aiLoading,
  onAnchorArticle,
}: ArticleReaderProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'card' | 'topics' | 'actions' | 'notes'>('content');
  const [notesText, setNotesText] = useState(article.user_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await onSaveNotes(article.id, notesText);
      alert('备注已保存成功！');
    } catch (e: any) {
      console.error(e);
      alert('保存备注失败，请重试');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleRunAIProcess = async () => {
    setErrorStatus(null);
    try {
      await onGenerateAI(article.id);
      setActiveTab('summary');
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'AI 智慧提炼遇到故障，请检查您的 Gemini 密钥。');
    }
  };

  const handleExportMarkdown = () => {
    // Generate structured Markdown per specification
    let md = `# ${article.title}

* **作者**: ${article.author}
* **来源**: ${article.source} (${article.source_type})
* **发布时间**: ${article.publish_time}
* **原文链接**: ${article.url}
* **标签**: ${article.tags.map((t) => `#${t}`).join(', ') || '暂无'}

---

## 📄 原文

${article.content}

`;

    if (article.ai_summary) {
      md += `
---

## 🎯 AI摘要与核心观点

### 一句话总结
> ${article.ai_summary.one_sentence}

### 三点核心 takeaways
${article.ai_summary.takeaways.map((t) => `* ${t}`).join('\n')}

### 核心观点阐述
${article.ai_summary.views.map((v) => `* ${v}`).join('\n')}

### 关键定量数据参数
${article.ai_summary.stats.map((s) => `* ${s}`).join('\n')}
`;
    }

    if (article.knowledge_card) {
      md += `
---

## 💡 AI核心知识卡片

* **核心概念名词**: ${article.knowledge_card.concept}
* **行业痛点背景**: ${article.knowledge_card.background}
* **发展观点路线**: ${article.knowledge_card.views}
* **验证及落地案例**: ${article.knowledge_card.cases}
* **最佳套用场景**: ${article.knowledge_card.scenarios}
* **推荐延伸文献**: ${article.knowledge_card.reading}
`;
    }

    if (article.ai_topics) {
      md += `
---

## 📝 AI 创意选题与策划案

* **公众号文章策划**: ${article.ai_topics.wechat}
* **小红书干货图文**: ${article.ai_topics.xiaohongshu}
* **短视频脚本逻辑**: ${article.ai_topics.video}
* **深度播客冲突大纲**: ${article.ai_topics.podcast}
* **Rational Newsletter**: ${article.ai_topics.newsletter}
`;
    }

    if (article.ai_action_items) {
      md += `
---

## 🚀 商业洞察实践建议与行动项

### 分离出的产品/商业机会
${article.ai_action_items.opportunities.map((o) => `* [机会] ${o}`).join('\n')}

### 冷启动与流量增长策略
${article.ai_action_items.growth_strategies.map((g) => `* [策略] ${g}`).join('\n')}

### 内部工作流程优化建议
${article.ai_action_items.operations.map((op) => `* [内部] ${op}`).join('\n')}

### 下一步调研竞品任务
${article.ai_action_items.surveys.map((s) => `* [调研] ${s}`).join('\n')}

### 严密监视的深水对手
${article.ai_action_items.competitors.map((c) => `* [对手] ${c}`).join('\n')}
`;
    }

    if (notesText) {
      md += `
---

## ✍️ 用户个人独家备注记录

> ${notesText}
`;
    }

    navigator.clipboard.writeText(md);
    alert('整篇 AI 知识资产标准 Markdown 数据已成功复制到剪贴板！');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-gray-150 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Navigation header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-55 to-white shrink-0">
          <div className="flex items-center space-x-2.5 truncate">
            <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded tracking-widest shrink-0">
              READER
            </span>
            <h2 className="text-sm font-semibold text-gray-900 truncate max-w-md sm:max-w-xl">
              {article.title}
            </h2>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onAnchorArticle(article)}
              className="p-1.5 border border-rose-200/50 hover:bg-rose-50 text-rose-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
              title="在下方QA助手中深度锚定提问"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">锚定至QA助理</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-950 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic sub navigation tabs */}
        <div className="px-5 border-b border-gray-100 flex flex-wrap gap-1.5 text-xs bg-white py-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
              activeTab === 'content' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            原文阅读
          </button>

          {article.ai_summary ? (
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                activeTab === 'summary' ? 'border-rose-500 text-rose-800' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              🎯 AI一句话与摘要
            </button>
          ) : (
            <button
              onClick={handleRunAIProcess}
              disabled={aiLoading}
              className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-lg font-bold flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{aiLoading ? '正在分析...' : '开启 AI 深度分析'}</span>
            </button>
          )}

          {article.knowledge_card && (
            <button
              onClick={() => setActiveTab('card')}
              className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                activeTab === 'card' ? 'border-orange-500 text-orange-800' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              💡 核心知识卡片
            </button>
          )}

          {article.ai_topics && (
            <button
              onClick={() => setActiveTab('topics')}
              className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                activeTab === 'topics' ? 'border-teal-500 text-teal-800' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              📝 创意选题大盘
            </button>
          )}

          {article.ai_action_items && (
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                activeTab === 'actions' ? 'border-blue-500 text-blue-800' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              🚀 首期行动清单
            </button>
          )}

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
              activeTab === 'notes' ? 'border-purple-500 text-purple-800' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            ✍️ 个人备注已存
          </button>
        </div>

        {/* Core Body Container scrollable details */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {errorStatus && (
            <div className="bg-red-50 border border-red-150 rounded-xl p-4 text-xs text-red-700 flex items-start space-x-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">AI 数据提取阻碍</p>
                <p>{errorStatus}</p>
              </div>
            </div>
          )}

          {aiLoading && (
            <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-6 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-rose-900">大模型思考引擎正疯狂转动中...</p>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                Gemini 正在针对该篇幅的正文进行句法深度拆解，分类提取核心理论。稍等片刻，您将获得标准摘要、闪卡概念、爆红选题及成长增长策略！
              </p>
            </div>
          )}

          {!aiLoading && (
            <>
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* Article Metadata banner */}
                  <div className="bg-slate-50 border border-gray-150 p-4 rounded-xl flex flex-wrap gap-4 text-xs text-gray-500 font-sans">
                    <span className="font-semibold text-gray-800">作者 / 发布渠道: {article.author}</span>
                    <span>•</span>
                    <span>具体来源: {article.source}</span>
                    <span>•</span>
                    <span>监测评分: {article.ai_score}分</span>
                    <span>•</span>
                    <span>抓取时间: {new Date(article.publish_time).toLocaleString()}</span>
                  </div>

                  {/* Headline image */}
                  {article.images && article.images.length > 0 && (
                    <div className="rounded-xl overflow-hidden max-h-[300px]">
                      <img
                        src={article.images[0]}
                        alt="Core graphic"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Main content formatted parsing body */}
                  <div className="prose max-w-none text-slate-800 leading-relaxed font-sans text-sm sm:text-base">
                    <MarkdownViewer content={article.content} />
                  </div>
                </div>
              )}

              {activeTab === 'summary' && article.ai_summary && (
                <div className="space-y-6 animate-fade-in font-sans">
                  <div className="border shadow-xs border-rose-100 rounded-2xl p-5 bg-rose-50/15">
                    <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      ONE SENTENCE REVELATION
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-2.5 leading-snug">
                      “{article.ai_summary.one_sentence}”
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5 border-b pb-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-600" />
                        <span>三点高含金量摘要 (Takeaways)</span>
                      </h4>
                      <ul className="list-disc pl-5 space-y-2.5 text-xs sm:text-sm text-gray-700">
                        {article.ai_summary.takeaways.map((t, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      {/* Views */}
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5 border-b pb-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-600" />
                          <span>重要争议与犀利研判</span>
                        </h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
                          {article.ai_summary.views.map((v, idx) => (
                            <li key={idx}>{v}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2.5 pt-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5 border-b pb-1.5">
                          <Target className="w-3.5 h-3.5 text-orange-600" />
                          <span>提及关键定量数据指标</span>
                        </h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
                          {article.ai_summary.stats.map((s, idx) => (
                            <li key={idx} className="font-mono text-[11.5px]">{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'card' && article.knowledge_card && (
                <div className="space-y-5 animate-fade-in font-sans">
                  <div className="bg-gradient-to-r from-orange-50/30 to-rose-50/20 p-5 rounded-2xl border border-orange-100 border-l-4 border-l-orange-500">
                    <p className="text-[10px] text-orange-700 font-bold uppercase tracking-wider">CORE CONCEPT DEFINED</p>
                    <h3 className="text-lg font-extrabold text-gray-900 mt-1">{article.knowledge_card.concept}</h3>
                    <p className="text-xs text-gray-700 mt-2.5 leading-relaxed">{article.knowledge_card.background}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-150 p-4 rounded-xl space-y-1 bg-slate-50/20">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide">研判推演演化路线</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{article.knowledge_card.views}</p>
                    </div>

                    <div className="border border-gray-150 p-4 rounded-xl space-y-1 bg-slate-50/20">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide">行业测试及验证案例</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{article.knowledge_card.cases}</p>
                    </div>

                    <div className="border border-gray-150 p-4 rounded-xl space-y-1 bg-slate-50/20">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide">痛点最佳套用场景</p>
                      <p className="text-xs text-gray-800 font-semibold leading-relaxed">{article.knowledge_card.scenarios}</p>
                    </div>

                    <div className="border border-gray-150 p-4 rounded-xl space-y-1 bg-slate-50/20">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide">推荐延伸文献理论</p>
                      <p className="text-xs text-gray-600 leading-relaxed italic">{article.knowledge_card.reading}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'topics' && article.ai_topics && (
                <div className="space-y-4 animate-fade-in font-sans text-xs sm:text-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-3 flex items-center space-x-1.5">
                    <Lightbulb className="w-4 h-4 text-rose-500 animate-bounce" />
                    <span>新媒体创意脑暴裂变</span>
                  </h3>

                  <div className="space-y-3.5">
                    <div className="p-4 border border-gray-150 rounded-xl space-y-1.5 hover:shadow-xs transition-all bg-emerald-50/5/30">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">🟢 公众号主题文章选题</span>
                      <p className="font-semibold text-gray-900 pt-1 leading-snug">{article.ai_topics.wechat}</p>
                    </div>

                    <div className="p-4 border border-gray-150 rounded-xl space-y-1.5 hover:shadow-xs transition-all bg-red-50/5/30">
                      <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">🔴 小红书干货图文选题</span>
                      <p className="font-semibold text-gray-950 pt-1 leading-snug">{article.ai_topics.xiaohongshu}</p>
                    </div>

                    <div className="p-4 border border-gray-150 rounded-xl space-y-1.5 hover:shadow-xs transition-all bg-blue-50/5/30">
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">🔵 5分钟讲述法视频大纲</span>
                      <p className="text-gray-800 pt-1 leading-relaxed">{article.ai_topics.video}</p>
                    </div>

                    <div className="p-4 border border-gray-150 rounded-xl space-y-1.5 hover:shadow-xs transition-all bg-violet-50/5/30">
                      <span className="text-[10px] bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded">🟣 播客2-3人对话议程题</span>
                      <p className="text-gray-800 pt-1 leading-relaxed">{article.ai_topics.podcast}</p>
                    </div>

                    <div className="p-4 border border-gray-150 rounded-xl space-y-1.5 hover:shadow-xs transition-all bg-slate-50/5/30 animate-pulse">
                      <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">📰 行业中高端 Newsletter 刊发</span>
                      <p className="text-gray-800 pt-1 leading-relaxed">{article.ai_topics.newsletter}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && article.ai_action_items && (
                <div className="space-y-6 animate-fade-in font-sans text-xs sm:text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Opportunities */}
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest border-b pb-1">🔥 潜在小微创业商业契机</h4>
                      <ul className="list-disc pl-5 space-y-2.5 text-gray-800">
                        {article.ai_action_items.opportunities.map((o, idx) => (
                          <li key={idx} className="leading-relaxed font-semibold">{o}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Growth */}
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b pb-1">📊 冷启动推广裂变策略</h4>
                      <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        {article.ai_action_items.growth_strategies.map((g, idx) => (
                          <li key={idx}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-xs">
                    <div className="space-y-2">
                      <p className="font-bold text-gray-400 uppercase tracking-wider">🛠️ 组织或工具流程建议</p>
                      <ul className="list-decimal pl-4 text-gray-500 space-y-1">
                        {article.ai_action_items.operations.map((op, i) => (
                          <li key={i}>{op}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-gray-400 uppercase tracking-wider">🔬 下一步调研注册任务</p>
                      <ul className="list-decimal pl-4 text-gray-500 space-y-1">
                        {article.ai_action_items.surveys.map((sv, i) => (
                          <li key={i}>{sv}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <p className="font-bold text-gray-400 uppercase tracking-wider">👁️ 严密追踪的竞品动态</p>
                      <ul className="list-decimal pl-4 text-gray-500 space-y-1">
                        {article.ai_action_items.competitors.map((cp, i) => (
                          <li key={i}>{cp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4 animate-fade-in font-sans">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider">
                      编辑我针对该篇幅的个人想法与备注 (Markdown支持)
                    </label>
                    <textarea
                      placeholder="写下您的点子、对竞品的反思、或者是希望用作AI微调参考的信息备注..."
                      rows={8}
                      className="w-full text-xs sm:text-sm p-4 border border-gray-250 bg-gray-50/40 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingNotes ? '正在存盘...' : '存盘归档备注'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Action footer controls */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-55 shrink-0">
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => onToggleFavorite(article.id)}
              className={`p-2 border rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 text-xs ${
                article.is_favorite
                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                  : 'bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-900 border-gray-200'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>{article.is_favorite ? '已收藏' : '加入收藏'}</span>
            </button>

            <button
              onClick={() => onToggleLike(article.id)}
              className={`p-2 border rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 text-xs ${
                article.is_liked
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                  : 'bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-900 border-gray-200'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{article.is_liked ? '已点赞' : '点赞鼓励'}</span>
            </button>
          </div>

          <button
            onClick={handleExportMarkdown}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-xs text-gray-800 font-semibold border border-gray-300 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
            title="将正文外加所有AI选题、闪卡、行动清单生成标准 Markdown 文档"
          >
            <Copy className="w-4 h-4" />
            <span>导出标准 Markdown 资产包</span>
          </button>
        </div>
      </div>
    </div>
  );
}
