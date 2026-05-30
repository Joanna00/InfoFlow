/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DailyReport } from '../types.js';
import { Sparkles, Calendar, BookOpen, Layers, CheckSquare, Zap, Copy, Mail, Compass, RefreshCw } from 'lucide-react';

interface DailyBriefingProps {
  reports: DailyReport[];
  onGenerateReport: () => Promise<void>;
  loading: boolean;
}

export default function DailyBriefing({ reports, onGenerateReport, loading }: DailyBriefingProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [simulateChannel, setSimulateChannel] = useState<'none' | 'email' | 'telegram' | 'feishu'>('none');

  const activeReport = reports[selectedIdx];

  const handleCopyMarkdown = () => {
    if (!activeReport) return;

    const md = `# ${activeReport.title}

日期: ${activeReport.date}

---

## 📈 热门话题趋势
${activeReport.trending_topics.map((t) => `* ${t}`).join('\n')}

---

## 📰 今日重点要讯汇总
${activeReport.news
  .map(
    (n) => `### ${n.title}
* 评分: ${n.rating}分 | 来源: ${n.source}
* 摘要: ${n.summary}`
  )
  .join('\n\n')}

---

## 💡 AI 产品变现与落地机会建议
${activeReport.opportunities.map((o, idx) => `${idx + 1}. **${o}**`).join('\n')}

---

## 🎯 深度策略与选题路径建议
${activeReport.recommendations.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}

---

## 🚀 今日首期行动项清单
${activeReport.actions.map((a) => `- [ ] ${a}`).join('\n')}
`;

    navigator.clipboard.writeText(md);
    alert('Markdown 内参格式已成功复制到剪贴板！');
  };

  const getSimulatedPayload = () => {
    if (!activeReport) return '';
    if (simulateChannel === 'email') {
      return `【邮件群发预览】\n收件人: 创投合伙人 & 核心团队 (team@radar-intelligence.ai)\n主题: [内参] ${activeReport.title}\n\n尊敬的团队成员：\n系统今日从您的订阅源库（包含Sam Altman、机器之心等核心节点）为您萃取了今日AI大盘的价值高能点。以下为您展示机会概要：\n\n* 【今日焦点】 ${activeReport.news[0]?.title}\n* 【首要行动建议】 ${activeReport.actions[0]}\n\n请立即登录系统阅读完整 Markdown 极速知识卡资产。`;
    }
    if (simulateChannel === 'telegram') {
      return `【Telegram Bot 频道广播推送】\n🤖 Radar Bot 发送于: ${new Date().toLocaleTimeString()}\n\n📢 *${activeReport.title}*\n\n🔥 *热度焦点*:\n${activeReport.trending_topics.slice(0, 3).join(' | ')}\n\n💡 *核心发财极客产品机会研判*:\n- ${activeReport.opportunities[0]}\n\n✅ *行动清单*:\n- ${activeReport.actions[0]}\n\n🔗 详情点击后台安全内参链接。`;
    }
    if (simulateChannel === 'feishu') {
      return `【飞书智能助手机器人推送】\n📝 *${activeReport.title}*\n\n📈 今日风向标签：${activeReport.trending_topics.join(', ')}\n\n💼 今日选题建议推荐公众号：\n- ${activeReport.news[0]?.title || '多模态新机会'}\n\n💡 创投产品方向推荐：\n- ${activeReport.opportunities[0] || '预置智能体编排'}\n\n请团队成员留意，尽快进行专题市场调研！`;
    }
    return '';
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      {/* Sidebar Report Select List */}
      <div className="xl:col-span-1 space-y-4">
        <button
          onClick={onGenerateReport}
          disabled={loading}
          className="w-full bg-gradient-to-r from-gray-900 to-slate-900 text-white hover:from-black hover:to-slate-950 text-xs font-semibold py-3.5 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center space-x-2 border border-slate-800 cursor-pointer disabled:opacity-50 group"
        >
          <Sparkles className={`w-4 h-4 text-rose-400 group-hover:rotate-12 transition-transform ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? '正在召唤AI生成...' : '召唤 AI 一键生成今日简报'}</span>
        </button>

        <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm space-y-2.5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">历史简报归档</h3>
          
          {reports.length === 0 ? (
            <p className="text-xs text-gray-400 italic px-2 py-4">暂无生成的历史报表</p>
          ) : (
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
              {reports.map((rep, idx) => (
                <button
                  key={rep.id}
                  onClick={() => {
                    setSelectedIdx(idx);
                    setSimulateChannel('none');
                  }}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-all border flex items-start space-x-2.5 cursor-pointer ${
                    selectedIdx === idx
                      ? 'bg-rose-50/30 border-rose-200 text-rose-900 font-medium'
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold line-clamp-1">{rep.title}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{rep.date}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Report Visualizer Page */}
      <div className="xl:col-span-3 space-y-6">
        {!activeReport ? (
          <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center shadow-sm">
            <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
            <p className="text-sm font-semibold text-gray-700">尚未生成今日情报内参简报</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              系统将根据您当前内容流中收藏、点赞、阅读的偏好和前沿数据，一键聚合并给出独家商业机会推荐。请点击左侧按钮立即一键召唤！
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden border-t-4 border-t-rose-500">
            {/* Report Header */}
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-br from-rose-50/10 via-white to-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-rose-500 text-white px-2.5 py-1 rounded">
                      INTELLIGENCE BRIEFING
                    </span>
                    <span className="text-xs text-gray-500 font-mono flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{activeReport.date}</span>
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                    {activeReport.title}
                  </h1>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleCopyMarkdown}
                    className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="复制为标准 Markdown"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">复制 Markdown</span>
                  </button>
                </div>
              </div>

              {/* Trending topics */}
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 text-xs mr-2">
                  火热标签趋势:
                </span>
                {activeReport.trending_topics.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-gray-100 font-medium text-gray-700 px-2.5 py-1 rounded-full border border-gray-200/50 hover:bg-gray-150 transition-colors"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Grid details */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* News cards */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                  <span>今日重点要讯速览</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeReport.news.map((item, idx) => (
                    <div key={idx} className="border border-gray-150 p-4 rounded-xl hover:shadow-sm transition-all bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2.5 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-1">{item.title}</h4>
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                          {item.rating}分
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 md:line-clamp-3 mb-2">{item.summary}</p>
                      <span className="text-[10px] text-gray-400 font-mono">数据来源: {item.source}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opportunities & Strategies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product hunt opportunities */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-rose-500" />
                    <span>AI 创业/产品变现高能机会</span>
                  </h3>

                  <div className="space-y-3.5">
                    {activeReport.opportunities.map((o, idx) => (
                      <div key={idx} className="flex items-start space-x-3 bg-rose-50/10 p-3.5 rounded-xl border border-rose-100/40">
                        <span className="bg-rose-100 text-rose-700 text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-gray-900 leading-relaxed pt-0.5">{o}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>深度策略与选题裂进规划</span>
                  </h3>

                  <div className="space-y-3.5">
                    {activeReport.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start space-x-3 bg-blue-50/10 p-3.5 rounded-xl border border-blue-100/40">
                        <span className="bg-blue-100 text-blue-700 text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-gray-700 leading-relaxed pt-0.5">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions checkpoint */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>今日推荐首要行动（Action Items）</span>
                </h3>

                <div className="space-y-2.5">
                  {activeReport.actions.map((act, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-gray-350 bg-white"
                        id={`act-${index}`}
                      />
                      <label htmlFor={`act-${index}`} className="text-xs text-gray-800 leading-snug cursor-pointer select-none">
                        {act}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulation Push Channels Section */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  <span>模拟信息推送通知</span>
                </h3>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => setSimulateChannel(simulateChannel === 'email' ? 'none' : 'email')}
                    className={`px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                      simulateChannel === 'email'
                        ? 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    📩 邮件群发模拟
                  </button>

                  <button
                    onClick={() => setSimulateChannel(simulateChannel === 'telegram' ? 'none' : 'telegram')}
                    className={`px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                      simulateChannel === 'telegram'
                        ? 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    🤖 Telegram Channel 模拟
                  </button>

                  <button
                    onClick={() => setSimulateChannel(simulateChannel === 'feishu' ? 'none' : 'feishu')}
                    className={`px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                      simulateChannel === 'feishu'
                        ? 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    💬 飞书 Bot 群消息模拟
                  </button>
                </div>

                {simulateChannel !== 'none' && (
                  <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-[11.5px] leading-relaxed relative overflow-hidden whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                    <span className="absolute top-2.5 right-3 text-[10px] text-gray-500 font-mono select-none">
                      PUSH SIMULATOR
                    </span>
                    {getSimulatedPayload()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
