import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

export default function QuestionBankPage() {
  return (
    <View className={styles.page}>
      <View className={styles.emptyState}>
        <Text className={styles.emptyIcon}>📝</Text>
        <Text className={styles.emptyText}>题库为空</Text>
        <Text className={styles.emptyHint}>从PDF导入并挖空后，题目将显示在这里</Text>
      </View>
    </View>
  )
}
