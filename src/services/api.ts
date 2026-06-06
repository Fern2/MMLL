import { supabase } from './supabase'
import type { Card, PracticeRecord, StudyStats, PdfFile } from '../types'

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

// ========== PDF文件管理 ==========

/**
 * 上传PDF文件到Supabase Storage
 * @param file - 文件对象
 * @param userId - 用户ID
 * @returns 文件信息
 */
export async function uploadPdfFile(file: File, userId: string): Promise<PdfFile> {
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  if (fileExt !== 'pdf') {
    throw new Error('仅支持PDF格式文件')
  }

  // 生成唯一文件名
  const fileName = `${userId}_${Date.now()}.pdf`
  const filePath = `pdfs/${fileName}`

  // 上传到Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('pdf-files')
    .upload(filePath, file, {
      contentType: 'application/pdf',
    })

  if (uploadError) throw uploadError

  // 获取文件URL
  const { data: urlData, error: urlError } = supabase.storage
    .from('pdf-files')
    .getPublicUrl(filePath)

  if (urlError) throw urlError

  // 保存文件记录到数据库
  const { data: recordData, error: recordError } = await supabase
    .from('pdf_files')
    .insert({
      name: file.name,
      path: filePath,
      url: urlData.publicUrl,
      size: file.size,
      userId,
    })
    .select()
    .single()

  if (recordError) throw recordError

  return recordData as PdfFile
}

/**
 * 删除PDF文件（从Storage和数据库）
 * @param fileId - 文件记录ID
 * @param filePath - 文件路径
 */
export async function deletePdfFile(fileId: string, filePath: string): Promise<void> {
  // 从Storage删除文件
  const { error: storageError } = await supabase.storage
    .from('pdf-files')
    .remove([filePath])

  if (storageError) throw storageError

  // 从数据库删除记录
  const { error: dbError } = await supabase
    .from('pdf_files')
    .delete()
    .eq('id', fileId)

  if (dbError) throw dbError
}

/**
 * 获取用户的PDF文件列表
 * @param userId - 用户ID
 * @returns PDF文件列表
 */
export async function fetchUserPdfs(userId: string): Promise<PdfFile[]> {
  const { data, error } = await supabase
    .from('pdf_files')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })

  if (error) throw error
  return (data || []) as PdfFile[]
}
