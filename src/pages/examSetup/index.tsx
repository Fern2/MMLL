import React, { useState } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

export default function ExamSetupPage() {
  const [questionCount, setQuestionCount] = useState(10)
  const [duration, setDuration] = useState(30)

  const handleStart = () => {
    Taro.navigateTo({
      url: `/pages/examTake/index?count=${questionCount}&duration=${duration}`
    })
  }

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>考试设置</Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>题目数量</Text>
          <View className={styles.picker}>
            {[5, 10, 15, 20, 30].map((num) => (
              <View
                key={num}
                className={`${styles.option} ${questionCount === num ? styles.active : ''}`}
                onClick={() => setQuestionCount(num)}
              >
                {num}题
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>考试时长</Text>
          <View className={styles.picker}>
            {[15, 30, 45, 60, 90].map((min) => (
              <View
                key={min}
                className={`${styles.option} ${duration === min ? styles.active : ''}`}
                onClick={() => setDuration(min)}
              >
                {min}分钟
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.startBtn} onClick={handleStart}>
        开始考试
      </View>
    </View>
  )
}
