import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

export default function UploadPage() {
  const handleUpload = () => {
    Taro.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0]
        if (file.size > 5 * 1024 * 1024) {
          Taro.showToast({ title: '文件不能超过5MB', icon: 'none' })
          return
        }
        Taro.showToast({ title: '已选择: ' + file.name, icon: 'success' })
        // TODO: 上传到云存储并解析
      },
      fail: () => {
        Taro.showToast({ title: '选择失败', icon: 'none' })
      }
    })
  }

  return (
    <View className={styles.page}>
      <View className={styles.uploadArea} onClick={handleUpload}>
        <Text className={styles.uploadIcon}>📄</Text>
        <Text className={styles.uploadText}>点击上传PDF文件</Text>
        <Text className={styles.uploadHint}>支持不超过5MB的文本型PDF</Text>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.infoTitle}>上传说明</Text>
        <Text className={styles.infoList}>
          1. 仅支持PDF格式文件{'n'}
          2. 文件大小不能超过5MB{'n'}
          3. 仅支持文本型PDF（可复制文字）{'n'}
          4. 扫描版PDF暂不支持识别
        </Text>
      </View>
    </View>
  )
}
