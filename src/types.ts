/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Source {
  id: string;
  name: string;
  url: string;
  type: 'x' | 'wechat' | 'rss' | 'website' | 'keyword';
  category: string;
  status: 'active' | 'inactive';
  tags: string[];
  lastFetched?: string;
}

export interface AISummary {
  one_sentence: string;
  takeaways: string[];
  views: string[];
  stats: string[];
}

export interface KnowledgeCard {
  concept: string;
  background: string;
  views: string;
  cases: string;
  scenarios: string;
  reading: string;
}

export interface AITopics {
  wechat: string;
  xiaohongshu: string;
  video: string;
  podcast: string;
  newsletter: string;
}

export interface AIActionItems {
  opportunities: string[];
  growth_strategies: string[];
  operations: string[];
  surveys: string[];
  competitors: string[];
}

export interface Article {
  id: string;
  title: string;
  author: string;
  publish_time: string;
  source: string;
  source_type: 'x' | 'wechat' | 'rss' | 'website' | 'keyword';
  url: string;
  content: string;
  images: string[];
  ai_score: number;
  is_favorite: boolean;
  is_liked: boolean;
  tags: string[];
  user_notes?: string;
  ai_summary?: AISummary | null;
  knowledge_card?: KnowledgeCard | null;
  ai_topics?: AITopics | null;
  ai_action_items?: AIActionItems | null;
}

export interface DailyReport {
  id: string;
  date: string;
  title: string;
  news: { title: string; summary: string; rating: number; source: string }[];
  trending_topics: string[];
  recommendations: string[];
  opportunities: string[];
  actions: string[];
}

export interface QAMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  groundingLinks?: { title: string; url: string }[];
}
