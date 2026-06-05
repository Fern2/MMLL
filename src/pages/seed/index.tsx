import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

export default function SeedPage() {
  const handleGenerate = () => {
    Taro.showToast({ title: '示例卡片已生成', icon: 'success' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.icon}>✨</Text>
        <Text className={styles.title}>示例卡片生成器</Text>
        <Text className={styles.desc}>
          一键生成5条示例卡片，包含专业课、英语、政治科目
        </Text>
        <View className={styles.generateBtn} onClick={handleGenerate}>
          生成示例卡片
        </View>
      </View>
    </View>
  )
}
