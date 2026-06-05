import React, { useState } from 'react'
import { View, Text, Textarea, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

export default function EditPage() {
  const [paragraph, setParagraph] = useState({
    text: '这是一段需要挖空的文本。用户可以在下方手动插入______，或者点击随机挖空按钮自动生成。',
    fileID: '',
    index: 0
  })
  const [blanksText, setBlanksText] = useState('')

  const handleRandomBlank = () => {
    const text = paragraph.text
    const maxBlanks = Math.min(3, Math.max(1, Math.floor(text.length / 50)))
    const blanksCount = Math.max(1, Math.floor(Math.random() * maxBlanks) + 1)

    let result = text
    const used = []

    for (let i = 0; i < blanksCount; i++) {
      let start, len, attempts = 0
      do {
        start = Math.floor(Math.random() * Math.max(0, result.length - 4))
        len = 2 + Math.floor(Math.random() * 3)
        const overlap = used.some(r => !(start + len <= r.start || start >= r.start + r.len))
        if (!overlap) break
        attempts++
      } while (attempts < 10)
      if (attempts >= 10) break
      used.push({ start, len })
      result = result.substring(0, start) + '______' + result.substring(start + len)
    }
    setBlanksText(result)
  }

  const handleSave = () => {
    Taro.showToast({ title: '题目保存成功', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 1000)
  }

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>原文内容</Text>
        <View className={styles.originalText}>{paragraph.text}</View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>编辑挖空（添加 "______" 空位）</Text>
        <Textarea
          className={styles.editArea}
          value={blanksText}
          onInput={(e) => setBlanksText(e.detail.value)}
          placeholder='在此编辑并插入占位'
        />
        <Button className={styles.randomBtn} onClick={handleRandomBlank}>
          🎲 随机挖空
        </Button>
      </View>

      <Button className={styles.saveBtn} onClick={handleSave}>
        保存题目
      </Button>
    </View>
  )
}
