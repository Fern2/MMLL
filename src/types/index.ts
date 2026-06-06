// 卡片/题目
export interface Card {
  id: string
  question: string
  answer: string
  subject: string
  tag: string
  srsLevel: number
  nextReview: string
  successCount: number
  failCount: number
  createdAt: string
  userId: string
}

// 做题记录
export interface PracticeRecord {
  id: string
  cardId: string
  userId: string
  isCorrect: boolean
  subject: string
  createdAt: string
}

// 学习统计
export interface StudyStats {
  totalCards: number
  todayLearned: number
  accuracy: number
  streak: number
  subjects: SubjectProgress[]
  weeklyData: WeeklyDay[]
}

export interface SubjectProgress {
  name: string
  total: number
  learned: number
  color: string
}

export interface WeeklyDay {
  day: string
  count: number
}

// 用户
export interface User {
  id: string
  email: string
  createdAt: string
}

// 倒计时
export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// PDF文件
export interface PdfFile {
  id: string
  name: string
  path: string
  url: string
  size: number
  createdAt: string
  userId: string
}
