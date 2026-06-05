import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useStore } from '../../stores/useStore'
import { mockCards } from '../../services/mockData'

export default function StudyPage() {
  const { cards, addRecord, userId } = useStore()
  const studyCards = cards.length > 0 ? cards : mockCards

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [failCount, setFailCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const currentCard = studyCards[currentIndex]
  const totalCards = studyCards.length

  const getSubjectClass = (subject: string) => {
    switch (subject) {
      case '政治': return styles.tagZyk
      case '英语': return styles.tagYy
      default: return styles.tagDefault
    }
  }

  const goNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowAnswer(false)
    } else {
      setIsComplete(true)
    }
  }

  const handleSuccess = () => {
    setSuccessCount(prev => prev + 1)
    addRecord({ cardId: currentCard.id, userId: userId || 'guest', isCorrect: true, subject: currentCard.subject, createdAt: new Date().toISOString() })
    Taro.showToast({ title: '✓ 记住了', icon: 'success', duration: 500 })
    goNext()
  }

  const handleFail = () => {
    setFailCount(prev => prev + 1)
    addRecord({ cardId: currentCard.id, userId: userId || 'guest', isCorrect: false, subject: currentCard.subject, createdAt: new Date().toISOString() })
    Taro.showToast({ title: '✗ 没记住', icon: 'none', duration: 500 })
    goNext()
  }

  const handleRestart = () => {
    setCurrentIndex(0); setSuccessCount(0); setFailCount(0); setShowAnswer(false); setIsComplete(false)
  }

  if (!currentCard && !isComplete) {
    return <View className={styles.page}><View className={styles.cardContainer}><Text>加载中...</Text></View></View>
  }

  if (isComplete) {
    return (
      <View className={styles.page}>
        <View className={styles.completeOverlay}>
          <View className={styles.completeCard}>
            <Text className={styles.completeIcon}>🎉</Text>
            <Text className={styles.completeTitle}>太棒了！</Text>
            <Text className={styles.completeStats}>已完成全部 {totalCards} 张卡片</Text>
            <View className={styles.completeStats}>
              <View className={styles.completeStat}>
                <Text className={styles.completeStatValue} style={{ color: '#00b42a' }}>{successCount}</Text>
                <Text className={styles.completeStatLabel}>记住了</Text>
              </View>
              <View className={styles.completeStat}>
                <Text className={styles.completeStatValue} style={{ color: '#f53f3f' }}>{failCount}</Text>
                <Text className={styles.completeStatLabel}>没记住</Text>
              </View>
            </View>
            <View className={styles.completeBtn} onClick={handleRestart}>重新学习</View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View>
          <Text className={styles.progress}>{currentIndex + 1} / {totalCards}</Text>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }} />
          </View>
        </View>
        <Text className={styles.srsInfo}>SRS Lv.{currentCard.srsLevel}</Text>
      </View>

      <View className={styles.cardContainer}>
        <View className={styles.flashCard}>
          <Text className={`${styles.cardSubject} ${getSubjectClass(currentCard.subject)}`}>{currentCard.subject}</Text>
          <Text className={styles.cardQuestion}>{currentCard.question}</Text>
          <View className={`${styles.cardAnswer} ${showAnswer ? styles.show : ''}`}>{currentCard.answer}</View>
          {!showAnswer && <Text className={styles.tapHint}>点击下方按钮显示答案</Text>}
        </View>
      </View>

      <View className={styles.actions}>
        {!showAnswer ? (
          <View className={`${styles.actionBtn} ${styles.btnShow}`} onClick={() => setShowAnswer(true)}>显示答案</View>
        ) : (
          <>
            <View className={`${styles.actionBtn} ${styles.btnFail}`} onClick={handleFail}>没记住</View>
            <View className={`${styles.actionBtn} ${styles.btnSuccess}`} onClick={handleSuccess}>记住了</View>
          </>
        )}
      </View>

      <View className={styles.footer}>
        <View className={styles.footerItem}><Text className={styles.footerValue}>{currentCard.successCount}</Text><Text className={styles.footerLabel}>成功次数</Text></View>
        <View className={styles.footerItem}><Text className={styles.footerValue}>{currentCard.failCount}</Text><Text className={styles.footerLabel}>失败次数</Text></View>
        <View className={styles.footerItem}><Text className={styles.footerValue}>{currentCard.tag}</Text><Text className={styles.footerLabel}>标签</Text></View>
      </View>
    </View>
  )
}
