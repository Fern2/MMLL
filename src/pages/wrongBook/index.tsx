import React from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useStore } from '../../stores/useStore'
import { mockCards } from '../../services/mockData'

export default function WrongBookPage() {
  const { records, cards } = useStore()
  const allCards = cards.length > 0 ? cards : mockCards
  const wrongRecords = records.filter(r => !r.isCorrect)
  const wrongCards = wrongRecords.map(r => allCards.find(c => c.id === r.cardId)).filter(Boolean)

  if (wrongCards.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📚</Text>
          <Text className={styles.emptyText}>暂无错题记录</Text>
          <Text className={styles.emptyText}>做完练习后错题会自动收集</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView className={styles.page} scrollY>
      {wrongCards.map((card, idx) => (
        <View key={idx} className={styles.cardItem}>
          <Text className={styles.cardSubject}>{card?.subject}</Text>
          <Text className={styles.cardQuestion}>{card?.question}</Text>
          <Text className={styles.cardAnswer}>{card?.answer}</Text>
          <View className={styles.cardActions}>
            <View className={styles.actionBtn} onClick={() => Taro.navigateTo({ url: `/pages/study/index?cardId=${card?.id}` })}>
              再次学习
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
