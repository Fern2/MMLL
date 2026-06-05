import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

export default function ExamResultPage() {
  const total = parseInt(Taro.getCurrentInstance().router?.params?.total || '10')
  const correct = parseInt(Taro.getCurrentInstance().router?.params?.correct || '0')
  const accuracy = Math.round((correct / total) * 100)

  const getGrade = () => {
    if (accuracy >= 90) return { emoji: '🏆', text: '优秀！' }
    if (accuracy >= 70) return { emoji: '👏', text: '良好' }
    if (accuracy >= 60) return { emoji: '💪', text: '及格' }
    return { emoji: '📚', text: '继续努力' }
  }

  const { emoji, text } = getGrade()

  const handleBack = () => {
    Taro.switchTab({ url: '/pages/today/index' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.emoji}>{emoji}</Text>
        <Text className={styles.title}>{text}</Text>

        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{total}</Text>
            <Text className={styles.statLabel}>总题数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#00b42a' }}>{correct}</Text>
            <Text className={styles.statLabel}>正确</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue} style={{ color: '#f53f3f' }}>{total - correct}</Text>
            <Text className={styles.statLabel}>错误</Text>
          </View>
        </View>

        <View className={styles.accuracy}>
          <Text className={styles.accuracyValue}>{accuracy}%</Text>
          <Text className={styles.accuracyLabel}>正确率</Text>
        </View>
      </View>

      <View className={styles.backBtn} onClick={handleBack}>
        返回首页
      </View>
    </View>
  )
}
