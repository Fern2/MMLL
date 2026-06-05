import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import type { Card, PracticeRecord } from '../types'

const CARDS_KEY = 'mmll_cards'
const RECORDS_KEY = 'mmll_records'

// ========== 数据读取 ==========
function loadCards(): Card[] {
  try { const raw = Taro.getStorageSync(CARDS_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function saveCards(cards: Card[]) {
  try { Taro.setStorageSync(CARDS_KEY, JSON.stringify(cards)) } catch { /* noop */ }
}
function loadRecords(): PracticeRecord[] {
  try { const raw = Taro.getStorageSync(RECORDS_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function saveRecords(records: PracticeRecord[]) {
  try { Taro.setStorageSync(RECORDS_KEY, JSON.stringify(records)) } catch { /* noop */ }
}

// ========== 全局状态 ==========
let _cards: Card[] = loadCards()
let _records: PracticeRecord[] = loadRecords()
let _userId: string | null = null

type Listener = () => void
const listeners: Set<Listener> = new Set()
function notify() { listeners.forEach(fn => fn()) }

export const store = {
  get cards() { return _cards },
  get records() { return _records },
  get userId() { return _userId },
  setCards(cards: Card[]) { _cards = cards; saveCards(cards); notify() },
  addCard(card: Card) { _cards = [..._cards, card]; saveCards(_cards); notify() },
  removeCard(id: string) { _cards = _cards.filter(c => c.id !== id); saveCards(_cards); notify() },
  addRecord(record: Omit<PracticeRecord, 'id'>) {
    _records = [..._records, { ...record, id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }]
    saveRecords(_records); notify()
  },
  setUserId(id: string) { _userId = id },
  initData(cards: Card[]) { _cards = cards; saveCards(cards); notify() },
  subscribe(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn) } },
}

// ========== React Hook ==========
export function useStore() {
  const [, setTick] = useState(0)
  const forceUpdate = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => store.subscribe(forceUpdate), [forceUpdate])

  return {
    cards: store.cards,
    records: store.records,
    userId: store.userId,
    setCards: (cards: Card[]) => store.setCards(cards),
    addCard: (card: Card) => store.addCard(card),
    removeCard: (id: string) => store.removeCard(id),
    addRecord: (record: Omit<PracticeRecord, 'id'>) => store.addRecord(record),
    setUserId: (id: string) => store.setUserId(id),
    initData: (cards: Card[]) => store.initData(cards),
  }
}
