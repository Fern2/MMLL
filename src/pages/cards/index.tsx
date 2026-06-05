import React, { useState } from 'react'
import { View, Text, ScrollView, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useStore } from '../../stores/useStore'
import { mockCards } from '../../services/mockData'

const subjects = ['全部', '专业课', '英语', '政治']

export default function CardsPage() {
  const { cards: storeCards, addCard } = useStore()
  const cards = storeCards.length > 0 ? storeCards : mockCards
  const [selectedSubject, setSelectedSubject] = useState('全部')
  const [showModal, setShowModal] = useState(false)
  const [newCard, setNewCard] = useState({ question: '', answer: '', subject: '专业课', tag: '' })

  const filteredCards = selectedSubject === '全部' ? cards : cards.filter(c => c.subject === selectedSubject)

  const getSubjectClass = (s: string) => {
    switch (s) { case '政治': return styles.tagZyk; case '英语': return styles.tagYy; default: return styles.tagDefault }
  }

  const handleAddCard = () => {
    if (!newCard.question.trim()) { Taro.showToast({ title: '请输入问题', icon: 'none' }); return }
    if (!newCard.answer.trim()) { Taro.showToast({ title: '请输入答案', icon: 'none' }); return }
    addCard({
      id: String(Date.now()), ...newCard, srsLevel: 1, nextReview: new Date().toISOString().split('T')[0],
      successCount: 0, failCount: 0, createdAt: new Date().toISOString(), userId: 'guest'
    })
    Taro.showToast({ title: '添加成功', icon: 'success' })
    setShowModal(false)
    setNewCard({ question: '', answer: '', subject: '专业课', tag: '' })
  }

  const handleStudy = (cardId: string) => { Taro.navigateTo({ url: `/pages/study/index?cardId=${cardId}` }) }
  const handleBatchStudy = () => { Taro.navigateTo({ url: '/pages/study/index?mode=batch' }) }
  const handleImportPDF = () => { Taro.navigateTo({ url: '/pages/upload/index' }) }

  const subjectOptions = ['专业课', '英语', '政治']

  return (
    <View className={styles.page}>
      <View className={styles.filterBar}>
        <ScrollView scrollX enableFlex className={styles.filterScroll}>
          {subjects.map(s => (
            <View key={s} className={`${styles.filterItem} ${selectedSubject === s ? styles.active : ''}`}
              onClick={() => setSelectedSubject(s)}>{s}</View>
          ))}
        </ScrollView>
      </View>

      {filteredCards.length > 0 ? (
        <ScrollView scrollY className={styles.cardList}>
          {filteredCards.map(card => (
            <View key={card.id} className={styles.cardItem}>
              <View className={styles.cardHeader}>
                <Text className={`${styles.subjectTag} ${getSubjectClass(card.subject)}`}>{card.subject}</Text>
                <Text className={styles.srsBadge}>SRS Lv.{card.srsLevel}</Text>
              </View>
              <Text className={styles.cardQuestion}>{card.question}</Text>
              <Text className={styles.cardAnswer}>{card.answer}</Text>
              <View className={styles.cardFooter}>
                <Text className={styles.cardMeta}>{card.tag} · 成功{card.successCount}次/失败{card.failCount}次</Text>
                <View className={styles.cardActions}><View className={styles.actionBtn} onClick={() => handleStudy(card.id)}>学习</View></View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📚</Text><Text className={styles.emptyText}>暂无卡片</Text>
          <View className={styles.emptyBtn} onClick={() => setShowModal(true)}>添加第一张卡片</View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={`${styles.bottomBtn} ${styles.btnOutline}`} onClick={handleImportPDF}>📄 导入PDF</View>
        <View className={`${styles.bottomBtn} ${styles.btnOutline}`} onClick={handleBatchStudy}>📖 批量学习</View>
        <View className={`${styles.bottomBtn} ${styles.btnPrimary}`} onClick={() => setShowModal(true)}>+ 添加</View>
      </View>

      {showModal && (
        <View className={styles.modal} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>添加卡片</Text>
              <Text className={styles.modalClose} onClick={() => setShowModal(false)}>×</Text>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>问题</Text>
              <Textarea className={styles.formTextarea} placeholder='请输入问题/题目' value={newCard.question}
                onInput={e => setNewCard({ ...newCard, question: e.detail.value })} />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>答案</Text>
              <Textarea className={styles.formTextarea} placeholder='请输入答案' value={newCard.answer}
                onInput={e => setNewCard({ ...newCard, answer: e.detail.value })} />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>科目</Text>
              <View className={styles.formSelect}>
                {subjectOptions.map(subj => (
                  <View key={subj} className={`${styles.filterItem} ${newCard.subject === subj ? styles.active : ''}`}
                    style={{ marginBottom: '8rpx' }} onClick={() => setNewCard({ ...newCard, subject: subj })}>{subj}</View>
                ))}
              </View>
            </View>
            <View className={styles.submitBtn} onClick={handleAddCard}>保存卡片</View>
          </View>
        </View>
      )}
    </View>
  )
}
