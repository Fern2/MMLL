import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useStore } from '../../stores/useStore'
import { mockCards } from '../../services/mockData'

export default function ExamTakePage() {
  const { cards, addRecord, userId } = useStore()
  const questions = cards.length > 0 ? cards : mockCards
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correct, setCorrect] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const handleSubmit = () => {
    Taro.navigateTo({ url: `/pages/examResult/index?total=${questions.length}&correct=${correct}` })
  }

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) setCorrect(prev => prev + 1)
    addRecord({ cardId: questions[currentIndex].id, userId: userId || 'guest', isCorrect, subject: questions[currentIndex].subject, createdAt: new Date().toISOString() })
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowAnswer(false)
    } else {
      handleSubmit()
    }
  }

  const currentQ = questions[currentIndex]

  return (
    <View className={styles.page}>
      <View className={styles.timer}><Text className={styles.timerIcon}>⏱️</Text><Text className={styles.timerText}>{formatTime(timeLeft)}</Text></View>
      <View className={styles.progress}><Text>{currentIndex + 1}/{questions.length}</Text></View>
      <View className={styles.card}>
        <Text className={styles.question}>{currentQ.question}</Text>
        {showAnswer && <View className={styles.answer}><Text className={styles.answerLabel}>答案：</Text><Text>{currentQ.answer}</Text></View>}
      </View>
      <View className={styles.actions}>
        {!showAnswer ? (
          <View className={styles.showBtn} onClick={() => setShowAnswer(true)}>显示答案</View>
        ) : (
          <>
            <View className={styles.wrongBtn} onClick={() => handleAnswer(false)}>✗ 错误</View>
            <View className={styles.correctBtn} onClick={() => handleAnswer(true)}>✓ 正确</View>
          </>
        )}
      </View>
    </View>
  )
}
