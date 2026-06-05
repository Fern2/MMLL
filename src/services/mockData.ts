import type { Card, StudyStats } from '../types'

export const mockCards: Card[] = [
  {
    id: '1', question: '简述糖异生的生理意义',
    answer: '1. 维持血糖恒定\n2. 补充肝糖原储备\n3. 调节酸碱平衡\n4. 协助氨基酸代谢',
    subject: '专业课', tag: '生物化学', srsLevel: 2,
    nextReview: '2026-06-04', successCount: 5, failCount: 1,
    createdAt: '2026-01-01', userId: 'u1'
  },
  {
    id: '2', question: 'What is the main theme of the passage?',
    answer: 'The passage mainly discusses the importance of time management in modern life.',
    subject: '英语', tag: '阅读理解', srsLevel: 3,
    nextReview: '2026-06-03', successCount: 8, failCount: 2,
    createdAt: '2026-01-01', userId: 'u1'
  },
  {
    id: '3', question: '唯物辩证法的基本规律有哪些？',
    answer: '对立统一规律、质量互变规律、否定之否定规律',
    subject: '政治', tag: '马克思主义基本原理', srsLevel: 1,
    nextReview: '2026-06-05', successCount: 3, failCount: 0,
    createdAt: '2026-01-01', userId: 'u1'
  },
  {
    id: '4', question: '简述心肌梗死的临床表现',
    answer: '1. 持续性胸痛\n2. 心悸、气促\n3. 可伴恶心、呕吐\n4. 心律失常',
    subject: '专业课', tag: '内科学', srsLevel: 2,
    nextReview: '2026-06-03', successCount: 6, failCount: 1,
    createdAt: '2026-01-01', userId: 'u1'
  },
  {
    id: '5', question: 'The phrase "economic downturn" in paragraph 3 refers to...',
    answer: 'A period of reduced economic activity and declining GDP growth.',
    subject: '英语', tag: '阅读理解', srsLevel: 4,
    nextReview: '2026-06-06', successCount: 10, failCount: 3,
    createdAt: '2026-01-01', userId: 'u1'
  },
  {
    id: '6', question: '资本主义生产方式的基本矛盾是？',
    answer: '生产社会化与生产资料私人占有之间的矛盾',
    subject: '政治', tag: '政治经济学', srsLevel: 1,
    nextReview: '2026-06-04', successCount: 2, failCount: 1,
    createdAt: '2026-01-01', userId: 'u1'
  },
]

export const mockStats: StudyStats = {
  totalCards: 156,
  todayLearned: 12,
  accuracy: 78,
  streak: 5,
  weeklyData: [
    { day: '周一', count: 15 }, { day: '周二', count: 8 },
    { day: '周三', count: 22 }, { day: '周四', count: 18 },
    { day: '周五', count: 12 }, { day: '周六', count: 25 },
    { day: '周日', count: 10 },
  ],
  subjects: [
    { name: '专业课', total: 100, learned: 65, color: '#722ed1' },
    { name: '英语', total: 35, learned: 18, color: '#0fc19c' },
    { name: '政治', total: 21, learned: 6, color: '#165dff' },
  ],
}
