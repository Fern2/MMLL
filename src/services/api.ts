import { supabase } from './supabase'
import type { Card, PracticeRecord, StudyStats } from '../types'

// 模拟数据（后端未接入时的回退）
import { mockCards, mockStats } from './mockData'

// 已配置 Supabase，关闭模拟数据
const USE_MOCK = false // 使用真实后端

// ========== 题库 ==========

/** 获取所有卡片 */
export async function fetchCards(): Promise<Card[]> {
  if (USE_MOCK) return mockCards
  const { data, error } = await supabase.from('cards').select('*')
  if (error) throw error
  return data
}

/** 新增卡片 */
export async function createCard(card: Omit<Card, 'id' | 'createdAt'>): Promise<Card> {
  if (USE_MOCK) {
    const newCard = { ...card, id: String(Date.now()), createdAt: new Date().toISOString() } as Card
    mockCards.push(newCard)
    return newCard
  }
  const { data, error } = await supabase.from('cards').insert(card).select().single()
  if (error) throw error
  return data
}

/** 删除卡片 */
export async function deleteCard(id: string): Promise<void> {
  if (USE_MOCK) {
    const idx = mockCards.findIndex(c => c.id === id)
    if (idx > -1) mockCards.splice(idx, 1)
    return
  }
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
}

// ========== 做题记录 ==========

/** 保存做题记录 */
export async function savePracticeRecord(record: Omit<PracticeRecord, 'id'>): Promise<void> {
  if (USE_MOCK) return
  const { error } = await supabase.from('practice_records').insert(record)
  if (error) throw error
}

/** 获取今日做题记录 */
export async function fetchTodayRecords(userId: string): Promise<PracticeRecord[]> {
  if (USE_MOCK) return []
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('practice_records')
    .select('*')
    .eq('userId', userId)
    .gte('createdAt', today)
  if (error) throw error
  return data
}

// ========== 统计 ==========

/** 获取学习统计 */
export async function fetchStats(_userId?: string): Promise<StudyStats> {
  if (USE_MOCK) return mockStats

  const { data: records } = await supabase.from('practice_records').select('*')
  const { data: cards } = await supabase.from('cards').select('*')

  const today = new Date().toISOString().split('T')[0]
  const todayRecords = (records || []).filter(r => r.createdAt.startsWith(today))

  return {
    totalCards: cards?.length || 0,
    todayLearned: todayRecords.length,
    accuracy: records?.length
      ? Math.round((records.filter(r => r.isCorrect).length / records.length) * 100)
      : 0,
    streak: 0,
    subjects: [],
    weeklyData: [],
  }
}
