/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { QAMessage } from '../types.js';
import { Send, Bot, User, RefreshCw, AlertTriangle, HelpCircle, ExternalLink, Sparkles } from 'lucide-react';

interface AIChatbotProps {
  onSendMessage: (messages: QAMessage[]) => Promise<{ text: string; groundingLinks?: { title: string; url: string }[] }>;
  selectedArticleId?: string;
  selectedArticleTitle?: string;
  onClearSelectedArticle?: () => void;
}

export default function AIChatbot({ onSendMessage, selectedArticleId, selectedArticleTitle, onClearSelectedArticle }: AIChatbotProps) {
  const [messages, setMessages] = useState<QAMessage[]>([
    {
      sender: 'assistant',
      text: '你好！我是 AI 情报雷达问答助理。您可以向我提问关于您所收藏、采集的所有科技论文、创业资讯、GitHub 开源项目的具体内容。\n\n**例如，您可以点击下方快捷方式提问：**',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [working, setWorking] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const listEndRef = useRef<HTMLDivElement>(null);

  const shortcutPrompts = [
    { label: '🌟 汇总近期收藏机会', text: '请帮我汇总最近收藏的所有资讯，提炼出前沿趋势和产品红利。' },
    { label: '🚀 提炼 10 个商业点子', text: '从这些收藏的文章中，发散提炼 10 个具体小微 SaaS 的创业和变现点子。' },
    { label: '📊 生成行业内参周报', text: '基于现有采集的信息资产，写一份高信息密度、高可读性的行业内参周报。' },
  ];

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || working) return;

    setErrorStatus(null);
    const userMsg: QAMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMsg('');
    setWorking(true);

    try {
      const response = await onSendMessage([...messages, userMsg]);
      const assistantMsg: QAMessage = {
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString(),
        groundingLinks: response.groundingLinks,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || '召唤 Gemini 接口失败，请检查网络或确认秘钥。');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
      {/* Bot Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            <Bot className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-1.5">
              <span>AI 语义问答助手</span>
              <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-mono">
                GEMINI POWERED
              </span>
            </h3>
            <p className="text-xs text-gray-500">基于数据库知识资产库及最近收藏分析上下文</p>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            onClick={() => {
              setMessages([
                {
                  sender: 'assistant',
                  text: '已为您清空历史，重新开启新的对话。请问有什么问题我可以帮您？',
                  timestamp: new Date().toLocaleTimeString(),
                },
              ]);
              setErrorStatus(null);
            }}
            className="text-[11px] text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            重置对话
          </button>
        )}
      </div>

      {/* Target Focus contextual banner */}
      {selectedArticleId && (
        <div className="px-5 py-2.5 bg-rose-50/40 border-b border-rose-100/60 text-xs text-rose-900 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="font-semibold">特定引用分析模式:</span>
            <span className="truncate italic">“{selectedArticleTitle}”</span>
          </div>
          <button
            onClick={onClearSelectedArticle}
            className="text-[10px] text-rose-700 hover:text-rose-900 underline font-semibold cursor-pointer shrink-0 ml-2"
          >
            清除锚定
          </button>
        </div>
      )}

      {/* Messages Thread body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gray-55/60">
        {messages.map((m, index) => {
          const isMe = m.sender === 'user';
          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-start space-x-2.5`}>
              {!isMe && (
                <div className="bg-rose-50 border border-rose-100 p-2 rounded-xl shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-rose-600" />
                </div>
              )}

              <div className="max-w-[85%] space-y-1">
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gray-900 text-white rounded-br-none'
                      : 'bg-white border border-gray-150 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* References indicator */}
                  {!isMe && m.groundingLinks && m.groundingLinks.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-gray-100 space-y-1.5 text-[11px]">
                      <p className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">
                        知识参考源引用 ({m.groundingLinks.length}):
                      </p>
                      {m.groundingLinks.map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1 text-rose-600 hover:text-rose-800 hover:underline inline-flex mr-4"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{link.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <p className={`text-[10px] text-gray-400 font-mono ${isMe ? 'text-right' : 'text-left'}`}>
                  {m.timestamp}
                </p>
              </div>

              {isMe && (
                <div className="bg-gray-100 border border-gray-200 p-2 rounded-xl shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-gray-600" />
                </div>
              )}
            </div>
          );
        })}

        {working && (
          <div className="flex justify-start items-start space-x-2.5">
            <div className="bg-rose-50 border border-rose-100 p-2 rounded-xl shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-rose-600 select-none animate-spin" />
            </div>
            <div className="bg-white border border-gray-150 p-4 rounded-xl rounded-bl-none shadow-sm text-xs text-gray-500 italic flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>AI正在穿梭于您的知识库并推演最犀利的答案，请稍候...</span>
            </div>
          </div>
        )}

        {errorStatus && (
          <div className="bg-red-50 border border-red-150 rounded-xl p-4 text-xs text-red-700 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">AI 对话发生故障</p>
              <p>{errorStatus}</p>
            </div>
          </div>
        )}

        {/* Dynamic Shortcut prompts (only shown when conversation is empty is ideal, but let's always show small widgets below for productivity) */}
        {!working && messages.length < 5 && (
          <div className="pt-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              <span>智能脑暴快捷灵感:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {shortcutPrompts.map((p, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSend(p.text)}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs px-3 py-2 rounded-xl outline-none transition-all cursor-pointer shadow-xs hover:border-rose-200"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={listEndRef} />
      </div>

      {/* Message Sender box */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex space-x-2.5"
        >
          <input
            type="text"
            className="flex-1 text-xs sm:text-sm border border-gray-250 rounded-xl px-4 py-3 bg-gray-50/50 outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white transition-all placeholder:text-gray-400"
            placeholder={selectedArticleId ? '问点跟特定文章相关的内容...' : '请输入问题，按回车或右侧按钮发送...'}
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            disabled={working}
          />
          <button
            type="submit"
            disabled={working || !inputMsg.trim()}
            className="bg-gray-900 hover:bg-black text-white shrink-0 p-3 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
