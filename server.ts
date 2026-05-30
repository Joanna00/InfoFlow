/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { Source, Article, DailyReport } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize local DB state
let currentDb: {
  sources: Source[];
  articles: Article[];
  dailyReports: DailyReport[];
} = {
  sources: [],
  articles: [],
  dailyReports: [],
};

// Seeding standard data helper
function seedInitialData() {
  const defaultSources: Source[] = [
    {
      id: 'src-1',
      name: '@sama (Sam Altman)',
      url: 'https://x.com/sama',
      type: 'x',
      category: '行业领袖',
      status: 'active',
      tags: ['AGI', 'OpenAI', 'Startup'],
    },
    {
      id: 'src-2',
      name: '@OpenAI',
      url: 'https://x.com/OpenAI',
      type: 'x',
      category: '厂商官方',
      status: 'active',
      tags: ['GPT-5', 'API', 'Safety'],
    },
    {
      id: 'src-3',
      name: '机器之心',
      url: '公众号: 机器之心',
      type: 'wechat',
      category: '技术媒体',
      status: 'active',
      tags: ['机器学习', '深度学习', '前沿研究'],
    },
    {
      id: 'src-4',
      name: '极客公园',
      url: '公众号: 极客公园',
      type: 'wechat',
      category: '行业观察',
      status: 'active',
      tags: ['产品创新', '商业化', '创始人'],
    },
    {
      id: 'src-5',
      name: 'TechCrunch AI',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      type: 'rss',
      category: '主流商业',
      status: 'active',
      tags: ['融资', '商业化', '硅谷动态'],
    },
    {
      id: 'src-6',
      name: 'Reddit - r/Singularity',
      url: 'https://www.reddit.com/r/singularity.rss',
      type: 'rss',
      category: '极客社区',
      status: 'active',
      tags: ['奇点', 'Agent', 'AGI 讨论'],
    },
    {
      id: 'src-7',
      name: 'Product Hunt AI Products',
      url: 'https://www.producthunt.com/topics/ai',
      type: 'website',
      category: '产品趋势',
      status: 'active',
      tags: ['新品发布', '微型SaaS', '降本增效'],
    },
    {
      id: 'src-8',
      name: 'Arxiv CS-AI Monitor',
      url: 'https://arxiv.org/list/cs.AI/recent',
      type: 'website',
      category: '学术论文',
      status: 'active',
      tags: ['科研', 'Agent 架构', '微调'],
    },
  ];

  const defaultArticles: Article[] = [
    {
      id: 'art-1',
      title: 'OpenAI 宣布推出全新 AI Agent 协作流：支持多 Agent 毫秒级任务拆解与即时复盘',
      author: 'OpenAI 官方博客',
      publish_time: '2026-05-29T10:30:00Z',
      source: '@OpenAI',
      source_type: 'x',
      url: 'https://x.com/OpenAI/status/123456789',
      images: ['https://picsum.photos/seed/openai_agent/800/450'],
      ai_score: 95,
      is_favorite: true,
      is_liked: true,
      tags: ['AI Agent', 'OpenAI', '多智能体协作'],
      content: `今天，OpenAI 宣布在大模型底层架构中深度整合了多 Agent 即时协作框架（Collaborative Flow）。这一特性允许单个 Prompt 触发多个内部垂直化 agent 团队：包含主任务规划师（Planner）、代码编写器（Coder）、沙盒测试仪（Sandbox Tester）以及事实审判员（Critic）。

在最新版本的微秒测试中，各智能体可以在 50 毫秒内实现跨模块状态同步，解决了复杂商业决策树下传统 Agent 链发生“记忆漂移”与“长轮询超时”的硬伤。

OpenAI 首席科学家表示：“这是迈向全自主生产力软件的重要基石。我们不再仅仅提供问答机，而是给每位工程师、文案作者配一整支高度默契的专业团队。”`,
      user_notes: '重点关注！多Agent架构的延迟和协作流，对于我们开发企业SaaS产品有颠覆性的降本增效价值。',
      ai_summary: {
        one_sentence: 'OpenAI 推出支持多智能体毫秒级任务拆解与在沙盒内自我修正的即时协同工作流。',
        takeaways: [
          '多系统协同：引入包含 Planner、Coder 和 Critic 的垂直子 Agent 战队协作机制。',
          '性能飞跃：协同过程控制在 50 毫秒以内，极大地缓解了长轮询超时和上下文遗忘硬伤。',
          '战略转向：AI 平台正在从“单点问答对话框”向“全自主团队工作流”的软件形式深刻转型。',
        ],
        views: [
          '这是全自主生产力工具的重要基标。',
          '微型服务与大语言模型混合编排将成为下个季度软件架构的核心标准。',
        ],
        stats: ['各智能体跨模块状态同步延迟低于 50 毫秒。', '测试显示该流程解决了传统长轮询上下文耗用 40% 的瓶颈问题。'],
      },
      knowledge_card: {
        concept: 'Collaborative Flow (多 Agent 即时协同框架)',
        background: '传统单 Agent 在应对数十步甚至更长的复合链路任务时容易发生发散或执行链冗余断电，新模式通过多 Agent 实时共识分摊了认知复杂性度。',
        views: '软件设计范式将实现由 “单机、单点人机交互” 向 “人发起战略，AI 群组自动战术执行” 的演进。',
        cases: '一家跨国咨询公司利用 Planner/Coder/Tester 执行系统日常税务自动申报，原本需要 4 人的核准组，现在仅需 1 名管理员监督。',
        scenarios: '对可靠度要求极高的流水线代码发布，多语种内容本土化协同，以及自动投资组合宏观研判与实时下单对账。',
        reading: 'OpenAI Developer Documentation Section on Workspace Collaborative Flow Design, May 2026.',
      },
      ai_topics: {
        wechat: '《Sam Altman 终于掀桌子了！OpenAI 发布多智能体协同框架，打工人最后的尊严没了？》',
        xiaohongshu: '震撼！AI 已经开始自己组队打工了。OpenAI 毫秒级 Agent 协作流深度解读 ✨💡',
        video: '脚本大纲：对比传统 Agent 笨重延迟、ChatGPT 多分身即时沙盒复脑方案并现场演练生成一款秒级落地APP。',
        podcast: '《高能聊 AI》—— 我们真的需要一个人当一家公司吗？解密多 Agent 协作底层密码。',
        newsletter: 'OpenAI Collaborative Flow launch: How standard UI grids will transform into organic autonomous agent bubbles.',
      },
      ai_action_items: {
        opportunities: [
          '围绕 OpenAI 的多子系统接口建立可视化的多 Agent 混合路由与编排工作台。',
          '开拓面向细分行业（如医药分析、跨境电商选品）的预置智能体班底（Planner + Critic）软件销售。',
        ],
        growth_strategies: [
          '发布一篇深度硬核技术评测文章，发布到 GitHub 获得首批 AI 开发者社区关注。',
        ],
        operations: [
          '优化现有应用的数据漏斗检索效率，设计多进程同步的错误恢复安全保全机制。',
        ],
        surveys: [
          '体验和测试 Cursor、LangChain 等已经集成的 Multi-Agent 功能进行全方位基准性能横向对比。',
        ],
        competitors: [
          '重点监视 Microsoft Autogen 和 CrewAI、LangGraph 最近在主线版本的重大同步更新。',
        ],
      },
    },
    {
      id: 'art-2',
      title: '硅谷新秀 Cursor 全自主克隆计划（Cursor Clone）爆红：利用 AI 几分钟重构自身，开发者门槛接近归零',
      author: '极客公园深度观察',
      publish_time: '2026-05-28T08:12:00Z',
      source: '极客公园',
      source_type: 'wechat',
      url: 'https://mp.weixin.qq.com/s/sample-cursor-clone',
      images: ['https://picsum.photos/seed/cursor_clone/800/450'],
      ai_score: 89,
      is_favorite: true,
      is_liked: false,
      tags: ['Cursor', '代码生成', '创业机会', '无代码'],
      content: `近日，一个在 GitHub 上名为 *Cursor-Clone* 的开源工具在短短三天内收获了超过 12,000 个 Stars。该项目的核心精髓极其戏剧化：它向公众公开了如何利用当前最先进的推理模型在大约 4 分钟时间内，以纯自然语言形式快速编写出一套带高级编辑联想、智能右侧控制板以及自适应终端的多功能 IDE 客户端。

开发者在演示中，仅仅使用了 5 段通俗易懂的中文 Prompt：“创造一个黑色 Brutalist 风格的窗口，左侧是文件列表，右侧是快捷 AI 聊天面板。能够根据我写的前 10 个字符推测下一步动作并渲染在阴影框里，支持直接通过一键点击完成替换。”

这个项目的出圈在技术圈内激起了海啸般的论战。一部分人认为这是高阶生产力的极致释放；但也有一批老牌资深全栈工程师感受到了严重的职业焦虑。`,
      user_notes: 'Cursor 克隆意味着核心 IDE 的壁垒不再是复杂的编写逻辑，而是如何建立场景化插件、协同以及自有的闭环用户工作流。',
    },
    {
      id: 'art-3',
      title: '从科研到商业：大语言模型在 Arxiv 顶会中关于智能客服主动纠错机制的最新探讨',
      author: '何啸天 博士',
      publish_time: '2026-05-27T15:45:00Z',
      source: 'Arxiv CS-AI Monitor',
      source_type: 'website',
      url: 'https://arxiv.org/abs/2605.99988',
      images: ['https://picsum.photos/seed/arxiv_llm/800/450'],
      ai_score: 81,
      is_favorite: false,
      is_liked: true,
      tags: ['学术论文', '大语言模型', '纠错机制'],
      content: `本文研究了当大语言模型（LLM）遇到错误推理链（Reasoning Hallucination）或不确定输入时，如何进行系统自适应“主动纠偏”（Initiative Error Correction）。研究提出了一种双线程对齐网络。其中，主输出线程负责以低延迟返回交互文本，而监控子线程则实时分析词向量熵变。如果熵变异常，系统将立即冻结主线程输出，并注入主动澄清疑问 Prompt。

论文评估结果表明，在高精准场景（如在线法律诉询、银行个人结息与退税申诉）中，双线程对齐机制可以将传统幻觉率拉低大约 68.4%。但也由此增加了 20% 左右的算力冗余。这为了商业化落地和边缘端运行时的优化提出了新的挑战。`,
    },
    {
      id: 'art-4',
      title: 'Hacker News 热议：小微 SaaS 创始人在 2026 年该如何生存？放弃大平台，聚焦私域壁垒',
      author: 'dangermouse_99',
      publish_time: '2026-05-26T04:20:00Z',
      source: 'TechCrunch AI',
      source_type: 'rss',
      url: 'https://news.ycombinator.com/item?id=55667788',
      images: ['https://picsum.photos/seed/saas_hn/800/450'],
      ai_score: 92,
      is_favorite: true,
      is_liked: true,
      tags: ['SaaS', '商业化', '独立开发', 'HN热帖'],
      content: `这篇在 Hacker News 上获得 650+ 点赞的热门讨论探究了在超级厂商（OpenAI、Microsoft、Google）层出不穷、功能几乎吞噬一切的大环境下，单兵作战或 3 个人规模的微型 SaaS 团队的核心立足点。

绝大多数回帖达成共识：与强大的 API 直接赛跑已经毫无胜算。小微产品必须：
1. 聚焦极其小众且对安全合规极高的本地/私网孤岛（比如医疗诊所的合规日历、地方法庭的语音归档加密检索）。
2. 将服务“体验化”与“重线下定制相结合”。AI 可以写一万行代码，但不能坐到企业客户的桌子旁，花半天时间帮其梳理内部杂乱无序的遗留报表。
3. 拥抱极端复古的简约设计。许多高阶经理人对复杂的多层仪表盘早已产生了视觉疲劳，他们甚至更愿意为一个“每天定时发送一封极简高精邮件汇报”的小工具付费。`,
    },
  ];

  const defaultReports: DailyReport[] = [
    {
      id: 'rep-1',
      date: '2026-05-30',
      title: '今日 AI 创新情报雷达 Daily Briefing',
      news: [
        {
          title: 'OpenAI 推出 Collaborative Flow 多 Agent 极速协同架构',
          summary: '支持多 Agent 分拆任务，50 毫秒完成状态同步，从单点回答向自主协同工作流跃迁。',
          rating: 95,
          source: '@OpenAI',
        },
        {
          title: 'Cursor 克隆计划引发全栈工程师焦虑：4分钟生成 IDE 引起强烈关注',
          summary: 'GitHub 开源项目短短 3 天斩获破万 Star，自然语言编程壁垒被彻底粉碎，产品切入点面临洗牌。',
          rating: 89,
          source: '极客公园',
        },
      ],
      trending_topics: ['#多智能体协作(Multi-Agent)', '#自然语言编程', '#独立开发者防身指南', '#主动纠错幻觉阻断'],
      recommendations: [
        '研究 OpenAI 协作流接口。建议针对特定高价值企业应用（如跨国供应链对账）设计多重代理审批流。',
        '降低纯工具界面的技术开发投入，转而专注于深度的细分私有数据源收集与独家专有连接流。',
      ],
      opportunities: [
        '“零代码多智能体混合编排看板” —— 帮助非技术岗位的主管，在无代码的情况下自由指定角色并拉群，让 AI 协作解决财务、法务等跨部门长链条工作。',
        '高保密本地化 LLM 主动对齐与异常中止网关（对应顶会双线程论文）。',
      ],
      actions: [
        '下载 Cursor Clone 项目，观察其提示词设计和编辑器与 AI 面板交互机制。',
        '对订阅源开展细化分类，增加“冷门高价值投资沙龙”与“冷门科技个人博客”以避免主流平台的信息过载和同质化。',
      ],
    },
  ];

  currentDb = {
    sources: defaultSources,
    articles: defaultArticles,
    dailyReports: defaultReports,
  };

  saveDb();
}

function loadDb() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      currentDb = JSON.parse(content);
      // Fallback arrays if empty
      if (!currentDb.sources) currentDb.sources = [];
      if (!currentDb.articles) currentDb.articles = [];
      if (!currentDb.dailyReports) currentDb.dailyReports = [];
    } catch (e) {
      console.error('Error parsing db file, reseeding initial datasets...', e);
      seedInitialData();
    }
  } else {
    seedInitialData();
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(currentDb, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving database to file: ', e);
  }
}

// Initial DB load
loadDb();

// --- Express API Routes ---

// 1. Sources API
app.get('/api/sources', (req, res) => {
  res.json(currentDb.sources);
});

app.post('/api/sources', (req, res) => {
  const { name, url, type, category, tags } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Missing name or type parameters' });
  }

  const newSource: Source = {
    id: `src-${Date.now()}`,
    name,
    url: url || '',
    type,
    category: category || '默认类目',
    status: 'active',
    tags: Array.isArray(tags) ? tags : [],
    lastFetched: new Date().toISOString(),
  };

  currentDb.sources.push(newSource);
  saveDb();
  res.status(201).json(newSource);
});

app.put('/api/sources/:id', (req, res) => {
  const { id } = req.params;
  const index = currentDb.sources.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Source not found' });
  }

  const body = req.body;
  currentDb.sources[index] = {
    ...currentDb.sources[index],
    ...body,
  };

  saveDb();
  res.json(currentDb.sources[index]);
});


// 1.1 Sources Sync Simulation APIs
app.post('/api/sources/:id/sync', async (req, res) => {
  const { id } = req.params;
  const source = currentDb.sources.find((s) => s.id === id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  source.lastFetched = new Date().toISOString();

  let syncedArticlesCount = 0;
  const newArticlesFound: Article[] = [];

  // Generate brand new highly relative articles based on this source name & type & tags dynamically
  if (geminiApiKey) {
    try {
      const prompt = `您是一个先进的信息监测同步引擎。我们的用户已经订阅了一个渠道：
名称: "${source.name}"
链接或账号ID: "${source.url}"
渠道类型: "${source.type}" (如 website, wechat, rss, x, keyword)
关注标签领域: ${JSON.stringify(source.tags)}

当前时间是 2026年5月30日。请假装这个渠道最近 1-2 天内发布了 1 篇符合该渠道一贯定位、高硬度信息密度且切中独立创客、商业创新痛点的前沿干货科技文章。
必须返回一个符合以下属性的 JSON 对象，包含一篇文章。不要添加任何Markdown外壳包裹：
{
  "title": "针对该渠道风格的爆款抓取标题（如 @sama 在X上发推阐明新动作，或 机器之心 的深度产业深度探讨，或微信公众号风格的重磅分享）",
  "author": "该渠道最具代表性的发言人/自媒体名",
  "content": "多段、详细、饱含定量数据、不少于400字并使用了标准Markdown排版符号的真实感正文内容。包含导语、事件详情、产业意义和实践建议。",
  "tags": ["标签1", "标签2", "标签3"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.title && parsed.content) {
        const item: Article = {
          id: `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: parsed.title,
          author: parsed.author || source.name,
          publish_time: new Date().toISOString(),
          source: source.name,
          source_type: source.type,
          url: source.url || 'https://radar.ai/intelligence-search',
          images: [`https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/800/450`],
          ai_score: Math.floor(Math.random() * 15) + 80,
          is_favorite: false,
          is_liked: false,
          tags: parsed.tags || source.tags,
          content: parsed.content,
        };
        currentDb.articles.unshift(item);
        newArticlesFound.push(item);
        syncedArticlesCount++;
      }
    } catch (e) {
      console.error('Source sync tool failed, fallback to template:', e);
    }
  }

  // Fallback if Gemini failed or is not configured yet
  if (syncedArticlesCount === 0) {
    const item: Article = {
      id: `art-${Date.now()}`,
      title: `【数据流抓取成功】来自订阅源 “${source.name}” 的最新情报通报`,
      author: source.name,
      publish_time: new Date().toISOString(),
      source: source.name,
      source_type: source.type,
      url: source.url || 'https://radar.ai/intelligence-search',
      images: [`https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/800/450`],
      ai_score: Math.floor(Math.random() * 15) + 75,
      is_favorite: false,
      is_liked: false,
      tags: [...source.tags, '定时刷新'],
      content: `这是从您的活动订阅渠道 “${source.name}” 模拟抓取拉取到的一篇高密数据流。
当前渠道绑定状态为：活动 (Active)。系统每隔一定周期或经由您手动触发，即可从该公众号/账号中智能截获最新发表的文案或代码段。

【本日情报推荐建议】：
1. 本文章内容旨在展示基于 “${source.name}” 对行业细分赛道 “${source.tags.join(' / ') || '默认创投'}” 的深刻监控。
2. 开发者已经开始向去中心化私域数据靠拢，针对该公众号的新抓取支持一键复制到“知识库-资产”一键转化为新媒体创意或落地行动。`,
    };
    currentDb.articles.unshift(item);
    newArticlesFound.push(item);
    syncedArticlesCount++;
  }

  saveDb();
  res.json({ success: true, count: syncedArticlesCount, articles: newArticlesFound });
});

app.post('/api/sources/sync-all', async (req, res) => {
  const activeSources = currentDb.sources.filter((s) => s.status === 'active');
  if (activeSources.length === 0) {
    return res.json({ success: true, count: 0, message: 'No active sources to sync' });
  }

  let totalCount = 0;
  const newlyCreated: Article[] = [];

  for (const source of activeSources) {
    source.lastFetched = new Date().toISOString();
    let synced = false;

    if (geminiApiKey) {
      try {
        const prompt = `您是“AI信息雷达”的信息采集模拟引擎。用户订阅了渠道：
名称: "${source.name}"
渠道类型: "${source.type}" (url: ${source.url})
时间: 2026年5月30日

请针对该渠道近半天内发表的一个全新技术或商业行业动态，编写一篇内容极其真实的行业深度文本。必须返回符合此结构的 JSON 响应：
{
  "title": "具体生动的标题",
  "author": "该渠道最具代表性的自媒体名",
  "content": "含有段落感的多行Markdown排版正文，不低于300字"
}
不要用任何格式化代码包裹块，直接输出 JSON 纯文本。`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.title && parsed.content) {
          const item: Article = {
            id: `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: parsed.title,
            author: parsed.author || source.name,
            publish_time: new Date().toISOString(),
            source: source.name,
            source_type: source.type,
            url: source.url || 'https://radar.ai/intelligence-search',
            images: [`https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/800/450`],
            ai_score: Math.floor(Math.random() * 15) + 80,
            is_favorite: false,
            is_liked: false,
            tags: source.tags,
            content: parsed.content,
          };
          currentDb.articles.unshift(item);
          newlyCreated.push(item);
          totalCount++;
          synced = true;
        }
      } catch (e) {
        console.error('Multi sync fallback due to Gemini error:', e);
      }
    }

    if (!synced) {
      const item: Article = {
        id: `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: `【全网轮询自动捕获】来自 “${source.name}” 的最新动态`,
        author: source.name,
        publish_time: new Date().toISOString(),
        source: source.name,
        source_type: source.type,
        url: source.url || 'https://radar.ai/intelligence-search',
        images: [`https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/800/450`],
        ai_score: Math.floor(Math.random() * 20) + 75,
        is_favorite: false,
        is_liked: false,
        tags: source.tags,
        content: `这是从您的订阅公众号/官方账号 “${source.name}” 在互联网公共空间中轮询到的最新干货推文。
监测到标签相关: ${source.tags.join(', ')}。
您可以点击阅读原文并进行深度 AI 分析！`,
      };
      currentDb.articles.unshift(item);
      newlyCreated.push(item);
      totalCount++;
    }
  }

  saveDb();
  res.json({ success: true, count: totalCount, articles: newlyCreated });
});

app.delete('/api/sources/:id', (req, res) => {
  const { id } = req.params;
  currentDb.sources = currentDb.sources.filter((s) => s.id !== id);
  saveDb();
  res.json({ success: true });
});

// 2. Articles API
app.get('/api/articles', (req, res) => {
  let list = [...currentDb.articles];

  // Sorting
  const sortBy = req.query.sortBy as string;
  if (sortBy === 'newest') {
    list.sort((a, b) => new Date(b.publish_time).getTime() - new Date(a.publish_time).getTime());
  } else if (sortBy === 'rating') {
    list.sort((a, b) => b.ai_score - a.ai_score);
  } else if (sortBy === 'hot') {
    // Simulated popularity score from AI score + likes
    list.sort((a, b) => (b.ai_score + (b.is_liked ? 10 : 0)) - (a.ai_score + (a.is_liked ? 10 : 0)));
  }

  res.json(list);
});

app.post('/api/articles/toggle-favorite', (req, res) => {
  const { id } = req.body;
  const art = currentDb.articles.find((a) => a.id === id);
  if (!art) {
    return res.status(404).json({ error: 'Article not found' });
  }

  art.is_favorite = !art.is_favorite;
  saveDb();
  res.json(art);
});

app.post('/api/articles/toggle-like', (req, res) => {
  const { id } = req.body;
  const art = currentDb.articles.find((a) => a.id === id);
  if (!art) {
    return res.status(404).json({ error: 'Article not found' });
  }

  art.is_liked = !art.is_liked;
  saveDb();
  res.json(art);
});

app.put('/api/articles/:id/notes', (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const art = currentDb.articles.find((a) => a.id === id);
  if (!art) {
    return res.status(404).json({ error: 'Article not found' });
  }

  art.user_notes = notes;
  saveDb();
  res.json(art);
});

// 3. AI Tasks Processor via Gemini API
app.post('/api/articles/:id/generate-ai', async (req, res) => {
  const { id } = req.params;
  const art = currentDb.articles.find((a) => a.id === id);
  if (!art) {
    return res.status(404).json({ error: 'Article not found' });
  }

  if (!geminiApiKey) {
    return res.status(400).json({
      error: '请先在系统 Secrets 面板中配置您的 GEMINI_API_KEY。',
    });
  }

  try {
    const prompt = `您是顶尖的AI知识资产提炼官、商业分析专家和内容创作者。下面是一篇用户采集的文章内容。请对其进行全方位的智能知识提炼加工，要求使用中文返回一个结构完备的JSON响应。

文章标题: "${art.title}"
文章来源: "${art.source}" (${art.source_type})
正文内容:
"${art.content}"

请严格按照如下JSON schema返回结果，不要带其余任何Markdown包裹符（如 \`\`\`json）：
{
  "summary": {
    "one_sentence": "用一句话精准概括文章精髓，具有高信息密度",
    "takeaways": ["提炼三点最核心的内容摘要，每点不少于40字", "第二个核心摘要", "第三个核心摘要"],
    "views": ["文章中表达的重要或具有争议的核心观点", "另一个观点（如有，或者作者隐藏的犀利思考）"],
    "stats": ["文章引用的关键定量数据、百分比、时间周期等（需注明场景，无则写'暂无公开定量数据'）", "第二条定量数据"]
  },
  "knowledge_card": {
    "concept": "提取出的核心技术名、商业理论或方法论名词与核心简短定义",
    "background": "该概念诞生的行业背景、所解决的痛点和瓶颈是什么",
    "views": "关于该概念，当下的核心研判和未来技术/产品演变路线倾向",
    "cases": "相关的商业实践、行业测试案例或著名验证落地表现",
    "scenarios": "该概念最佳落地、最适格套用的垂直业务场景（如：高保密对账、快节奏社群、微型SaaS等）",
    "reading": "推荐给读者的延伸阅读方向或参考资料文献类型"
  },
  "topics": {
    "wechat": "极具吸引力、能引发技术或商业圈子深度共鸣的公众号文章选题（包含推荐引爆前言点）",
    "xiaohongshu": "符合小红书风格、善用表情与吸睛痛点、适合干货卡片排版的选题设计",
    "video": "5分钟视频脚本的主题、开场吸引力设计与三段式讲述大纲方案",
    "podcast": "适合2-3人对话、有冲突感、深度剖析产品底层的播客主线题目与交锋提纲",
    "newsletter": "面向中高端专业读者、偏理性深度洞察的个人Newsletter刊登方向与推荐开篇梗概"
  },
  "action_items": {
    "opportunities": ["提炼1-2个针对初创公司、中小型团队或者工程师的实际“产品创业/商业变现机会”", "第二个具体机会开发方向"],
    "growth_strategies": ["如果用户要做这个方向的产品，给出1-2条冷启动增长策略或流量自裂变玩法"],
    "operations": ["针对文中所涉痛点，可以立即着手优化的内部业务流、工具链或降本增效手段"],
    "surveys": ["调研任务：写出用户下一步应该到市场上调查、注册和深入摸排的2款主流竞品或技术项目"],
    "competitors": ["竞品追踪：指示哪些上市公司、明星开源项目或巨头动作正在锁死该生态位，需要严密监视"]
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // Feed generated objects back to database item
    art.ai_summary = {
      one_sentence: parsed.summary?.one_sentence || '暂无提炼',
      takeaways: parsed.summary?.takeaways || [],
      views: parsed.summary?.views || [],
      stats: parsed.summary?.stats || [],
    };

    art.knowledge_card = {
      concept: parsed.knowledge_card?.concept || '暂无概念提取',
      background: parsed.knowledge_card?.background || '暂无背景研判',
      views: parsed.knowledge_card?.views || '暂无观点推演',
      cases: parsed.knowledge_card?.cases || '暂无商业验证',
      scenarios: parsed.knowledge_card?.scenarios || '暂无最适场景',
      reading: parsed.knowledge_card?.reading || '暂无延伸文献',
    };

    art.ai_topics = {
      wechat: parsed.topics?.wechat || '暂无推荐公众号选题',
      xiaohongshu: parsed.topics?.xiaohongshu || '暂无推荐小红书选题',
      video: parsed.topics?.video || '暂无推荐视频大纲',
      podcast: parsed.topics?.podcast || '暂无推荐播客大纲',
      newsletter: parsed.topics?.newsletter || '暂无推荐Newsletter选题',
    };

    art.ai_action_items = {
      opportunities: parsed.action_items?.opportunities || [],
      growth_strategies: parsed.action_items?.growth_strategies || [],
      operations: parsed.action_items?.operations || [],
      surveys: parsed.action_items?.surveys || [],
      competitors: parsed.action_items?.competitors || [],
    };

    // Uplift rating after active AI reasoning analysis
    art.ai_score = Math.min(100, Math.max(70, Math.floor(Math.random() * 15) + 85));

    saveDb();
    res.json(art);
  } catch (error: any) {
    console.error('Gemini API execution error: ', error);
    res.status(500).json({
      error: `Gemini AI 智能分析失败: ${error.message || '未知网络抖动，请重试'}.`,
    });
  }
});

// 4. Custom Manual / Crawler Simulation API
app.post('/api/articles/crawl', async (req, res) => {
  const { url, source_type, category_name } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Please submit a valid URL platform link or keyword' });
  }

  // Check if Gemini is loaded for intelligent context expansion.
  // If API key is configured, let's call Gemini to construct a beautiful realistic mock web post
  // based on crawling simulation. If not, fallback to styled templates.
  let crawledTitle = '未命名采集篇目';
  let crawledAuthor = '自助采集机器人';
  let crawledContent = '';
  let mockTags: string[] = ['自助分析', '全网监控'];

  if (geminiApiKey) {
    try {
      const prompt = `您是一个先进的信息网站网页爬虫模拟器。现在用户提交了一个采集线索（可以是一个URL、或者某个希望监控的关键词/公众号名）。
线索名称: "${url}"
线索类型: "${source_type || 'auto'}"

请利用您的前瞻性科技知识，模拟抓取或智能化生成一篇非常硬核、真实且符合创业、投资人痛点的优质行业观察/技术新闻。
要求返回一个包含 title, author, content, tags 属性的JSON。
- content 正文必须要包含：引人入胜的导言、丰富的干货详情分析、行业痛点与解决趋势、以及未来对独立创业者的影响，不低于400字。
请严格仅返回 JSON 结构：
{
  "title": "符合前沿科技趋势的具体新闻标题",
  "author": "知名的行业评论员或者具体的自媒体官方名称",
  "content": "完整的具有段落感的多行正文",
  "tags": ["标签1", "标签2", "标签3"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      crawledTitle = parsed.title || crawledTitle;
      crawledAuthor = parsed.author || crawledAuthor;
      crawledContent = parsed.content || crawledContent;
      mockTags = parsed.tags || mockTags;
    } catch (e) {
      console.error('Crawler intelligence simulator fallback due to: ', e);
    }
  }

  // Fallback content if not crawled properly
  if (!crawledContent) {
    crawledTitle = url.includes('http')
      ? `全网追踪报告：关于 “${url.substring(0, 30)}” 的新商业落地契机`
      : `核心关键词监控简报：围绕 “${url}” 的赛道玩家动态评估`;
    crawledAuthor = '智能信息雷达节点';
    crawledContent = `本篇属于智能系统自动代理抓取报告。线索内容为 "${url}"。
我们针对此方向监测到以下核心行业要点：
1. 生态互通：大厂API本周宣布向中小型中间件开发者开放更精细的上下文流式并发控制。
2. 信任摩擦：用户对私域数据的上传依旧存有警惕，隐私泄露治理成了当前同质化产品中突围的核心卖点。
3. 渠道优势：海外开发者在社交网络中进行长短视频矩阵引流正成为最廉价、转化率最高的冷启动方式。
更多深度分析，推荐点击右上角“启动 AI 深度提炼、选题与行动建议分析”进行专属定制！`;
    mockTags = ['自动采集', '风口监测', category_name || '综合要讯'];
  }

  const newArticle: Article = {
    id: `art-${Date.now()}`,
    title: crawledTitle,
    author: crawledAuthor,
    publish_time: new Date().toISOString(),
    source: url.replace('https://', '').replace('http://', '').split('/')[0] || '雷达主动监测',
    source_type: source_type || 'website',
    url: url.startsWith('http') ? url : 'https://radar.ai/intelligence-search',
    images: [`https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/800/450`],
    ai_score: Math.floor(Math.random() * 20) + 75,
    is_favorite: false,
    is_liked: false,
    tags: mockTags,
    content: crawledContent,
  };

  currentDb.articles.unshift(newArticle);
  saveDb();
  res.status(201).json(newArticle);
});

// 5. Daily Briefings System
app.get('/api/briefs', (req, res) => {
  res.json(currentDb.dailyReports);
});

app.post('/api/briefs/generate', async (req, res) => {
  if (!geminiApiKey) {
    return res.status(400).json({
      error: '请先在系统 Secrets 面板中配置您的 GEMINI_API_KEY。',
    });
  }

  try {
    // Collect all favorited articles or recent articles to feed into the digest context
    const favorites = currentDb.articles.filter((a) => a.is_favorite);
    const feedList = favorites.length > 0 ? favorites : currentDb.articles.slice(0, 5);

    const contextText = feedList
      .map((a, i) => `【要讯 #${i + 1}】标题: ${a.title}\n来源: ${a.source}\n要点: ${a.content.substring(0, 300)}...`)
      .join('\n\n');

    const prompt = `您是顶尖的创投内参主笔与独立商业分析师。根据以下今天采集积累的信息流内容，编写一份专属、高含金量的“每日情报雷达简报（Daily Briefing）”。
要点及文章上下文：
${contextText}

请返回符合此结构的 JSON 对象，不要用 Markdown 包裹：
{
  "title": "今日智能情报简报 (格式如: 2026年XX月XX日 AI 航向与新商业机会简报)",
  "trending_topics": ["#热点话题1", "#热点话题2", "#热点话题3", "#热点话题4"],
  "news_summaries": [
    {
      "title": "提炼要点1的标题",
      "summary": "100字以内的核心资讯总结，说明其为什么重要和对行业的启示机制",
      "rating": 95,
      "source": "对应来源名称"
    },
    {
      "title": "提炼要点2的标题",
      "summary": "100字以内的总结...",
      "rating": 90,
      "source": "对应来源名称"
    }
  ],
  "recommendations": [
    "针对这些要讯给创作者/产品经理的第1条实质规划建议",
    "第2条实质落地规划建议"
  ],
  "opportunities": [
    "指出今日最明显、触手可及的1-2个产品变现或产品功能改进机会",
    "另一个具体的商业开发建议"
  ],
  "actions": [
    "行动清单项1：今天立即去注册或查看某项目的代码或功能演示",
    "行动清单项2：重组自己的产品定位方案"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const newReport: DailyReport = {
      id: `rep-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: parsed.title || `${new Date().toLocaleDateString('zh-CN')} AI 航向情报极速雷达`,
      trending_topics: parsed.trending_topics || ['#智能体协作-Agent', '#创新冷启动'],
      news: parsed.news_summaries || [
        {
          title: '本期主要创新资讯汇总',
          summary: '今日资讯整体表明技术在毫秒级降本增效上取得长足进步，独立开发者应对其紧密关注。',
          rating: 85,
          source: '系统雷达',
        },
      ],
      recommendations: parsed.recommendations || ['建议多关注去中心化垂直SaaS和冷门安全合规赛道。'],
      opportunities: parsed.opportunities || ['建立面向团队垂直岗位的特异性协同机器人工具包。'],
      actions: parsed.actions || ['将自己收藏的文章转成Markdown知识卡沉淀到专属笔记。'],
    };

    currentDb.dailyReports.unshift(newReport);
    saveDb();
    res.status(201).json(newReport);
  } catch (error: any) {
    console.error('Briefing generator error: ', error);
    res.status(500).json({
      error: `日报系统生成失败: ${error.message || '网络不稳定，请重试'}`,
    });
  }
});

// 6. Knowledge QA Chatbot Core using Gemini API with Background Context
app.post('/api/ai/chatbot', async (req, res) => {
  const { messages, selectedArticleId } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing chat messages list' });
  }

  if (!geminiApiKey) {
    return res.status(400).json({
      error: '请先在系统 Secrets 面板中配置您的 GEMINI_API_KEY。',
    });
  }

  try {
    const userMessage = messages[messages.length - 1].text;

    // Retrieve active knowledge base articles to inject as context!
    // This allows the chatbot to have real-time memory of the user's curated pipeline!
    let knowledgeContext = '';
    if (selectedArticleId) {
      const art = currentDb.articles.find((a) => a.id === selectedArticleId);
      if (art) {
        knowledgeContext = `【当前阅读文章】
标题: ${art.title}
作者: ${art.author}
内容摘要: ${art.content.substring(0, 1000)}
${art.ai_summary ? `AI一句话总结: ${art.ai_summary.one_sentence}` : ''}`;
      }
    } else {
      // Feed favorited articles or recent ones as general background
      const favs = currentDb.articles.filter((a) => a.is_favorite);
      const targets = favs.length > 0 ? favs : currentDb.articles.slice(0, 3);
      knowledgeContext = targets
        .map((a, i) => `【知识库文献 #${i + 1}】\n标题: ${a.title}\n来源: ${a.source}\n要点: ${a.content.substring(0, 500)}`)
        .join('\n\n');
    }

    const systemInstruction = `您是“AI 信息雷达”专属智能问答助理。您的使命是基于用户的订阅源库、知识资产库及最近收藏的文章，给出超高含金量的、切中商业要害的解答。
任何时候都应保持专业、理性的创客思维（创业人、创作者、分析师）。
禁止废话，多以清晰的列表呈现行动指南、创意灵感、增长套路或技术解决方案。
下面是用户当前积累的【知识库背景上下文】，当用户提问相关事宜，或者要求您“总结本周收藏”、“提炼产品机会”、“编写简报”时，必须根据下面真实的上下文来推理和提取。

${knowledgeContext}`;

    // Convert message list for chat structure
    const geminiChatMessages = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    // Generate output
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: geminiChatMessages,
      config: {
        systemInstruction,
      },
    });

    const replyText = response.text || '暂未生成响应。';

    // Simulated sources grounding
    const groundingLinks: { title: string; url: string }[] = [];
    if (selectedArticleId) {
      const art = currentDb.articles.find((a) => a.id === selectedArticleId);
      if (art) {
        groundingLinks.push({ title: art.title, url: art.url });
      }
    } else {
      const favs = currentDb.articles.filter((a) => a.is_favorite);
      favs.slice(0, 2).forEach((f) => {
        groundingLinks.push({ title: f.title, url: f.url });
      });
    }

    res.json({
      text: replyText,
      groundingLinks: groundingLinks.length > 0 ? groundingLinks : undefined,
    });
  } catch (error: any) {
    console.error('QA Chatbot error: ', error);
    res.status(500).json({
      error: `问答处理失败: ${error.message || '网络超时'}`,
    });
  }
});

// Configure Vite or Static Production middleware
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Information Radar] Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
