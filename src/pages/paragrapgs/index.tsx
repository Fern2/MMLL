import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

export default function ParagraphsPage() {
  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className={styles.page}>
      <View className={styles.emptyState} onClick={handleBack}>
        <Text className={styles.emptyIcon}>📄</Text>
        <Text className={styles.emptyText}>暂无解析段落</Text>
        <Text className={styles.emptyHint}>请先上传PDF文件</Text>
      </View>
    </View>
  )
}
