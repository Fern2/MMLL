import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import { useStore } from '../../stores/useStore'
import { mockCards } from '../../services/mockData'

export default function PracticePage() {
  const { cards, addRecord, userId } = useStore()
  const questions = cards.length > 0 ? cards : mockCards
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [isFinished, setIsFinished] = useState(false)

  const currentQuestion = questions[currentIndex]

  const handleSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrect(prev => prev + 1)
    } else {
      setWrongIds(prev => [...prev, currentQuestion.id])
    }

    // 保存做题记录到 store
    addRecord({
      cardId: currentQuestion.id,
      userId: userId || 'guest',
      isCorrect,
      subject: currentQuestion.subject,
      createdAt: new Date().toISOString(),
    })

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowAnswer(false)
    } else {
      setIsFinished(true)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setCorrect(0)
    setWrongIds([])
    setShowAnswer(false)
    setIsFinished(false)
  }

  if (isFinished) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🎉</Text>
          <Text className={styles.emptyText}>
            完成！正确率 {Math.round((correct / questions.length) * 100)}%
          </Text>
          <Text className={styles.emptyText}>
            错题 {wrongIds.length} 道，已自动收入错题本
          </Text>
          <View className={styles.startBtn} onClick={handleRestart}>
            重新开始
          </View>
        </View>
      </View>
    )
  }

  if (!currentQuestion) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📝</Text>
          <Text className={styles.emptyText}>暂无练习题目</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.practiceCard}>
        <Text className={styles.practiceIcon}>📝</Text>
        <Text className={styles.practiceProgress}>
          题目 {currentIndex + 1}/{questions.length}
        </Text>
        <Text className={styles.practiceQuestion}>
          {currentQuestion.question}
        </Text>
        {showAnswer && (
          <View className={styles.answerBox}>
            <Text className={styles.answerText}>{currentQuestion.answer}</Text>
          </View>
        )}
        <View className={styles.actionRow}>
          {!showAnswer ? (
            <View
              className={`${styles.actionBtn} ${styles.btnOutline}`}
              onClick={() => setShowAnswer(true)}
            >
              查看答案
            </View>
          ) : (
            <>
              <View
                className={`${styles.actionBtn} ${styles.btnDanger}`}
                onClick={() => handleSubmit(false)}
              >
                ✗ 错误
              </View>
              <View
                className={`${styles.actionBtn} ${styles.btnSuccess}`}
                onClick={() => handleSubmit(true)}
              >
                ✓ 正确
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  )
}
