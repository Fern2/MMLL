import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import styles from './index.module.scss'
import { useStore } from '../../stores/useStore'
import { mockCards, mockStats } from '../../services/mockData'

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function StatsPage() {
  const { cards, records } = useStore()

  const stats = useMemo(() => {
    const allCards = cards.length > 0 ? cards : mockCards
    const totalCards = allCards.length
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = records.filter(r => r.createdAt.startsWith(today))
    const todayLearned = todayRecords.length
    const allCorrect = records.filter(r => r.isCorrect).length
    const accuracy = records.length > 0 ? Math.round((allCorrect / records.length) * 100) : 0

    const subjects = ['专业课', '英语', '政治']
    const colors = ['#722ed1', '#0fc19c', '#165dff']
    const subjectData = subjects.map((name, i) => {
      const subCards = allCards.filter(c => c.subject === name)
      return { name, count: subCards.length, learned: subCards.filter(c => c.successCount > 0).length, color: colors[i] }
    })

    // 近7天学习量
    const weeklyData = dayNames.map(day => ({ day, count: 0 }))
    records.forEach(r => {
      const d = new Date(r.createdAt).getDay()
      const weekAgo = Date.now() - 7 * 86400000
      if (new Date(r.createdAt).getTime() > weekAgo) {
        weeklyData[d].count++
      }
    })

    return { totalCards, todayLearned, accuracy, subjects: subjectData, weeklyData }
  }, [cards, records])

  const maxCount = Math.max(...stats.weeklyData.map(d => d.count), 1)

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.overviewCard}>
        <Text className={styles.overviewTitle}>学习概览</Text>
        <View className={styles.overviewGrid}>
          <View className={styles.overviewItem}><Text className={styles.overviewValue}>{stats.totalCards}<Text className={styles.overviewUnit}>张</Text></Text><Text className={styles.overviewLabel}>总卡片数</Text></View>
          <View className={styles.overviewItem}><Text className={styles.overviewValue}>{stats.todayLearned}<Text className={styles.overviewUnit}>张</Text></Text><Text className={styles.overviewLabel}>今日已学</Text></View>
          <View className={styles.overviewItem}><Text className={styles.overviewValue}>{stats.accuracy}<Text className={styles.overviewUnit}>%</Text></Text><Text className={styles.overviewLabel}>正确率</Text></View>
          <View className={styles.overviewItem}><Text className={styles.overviewValue}>{records.length}<Text className={styles.overviewUnit}>次</Text></Text><Text className={styles.overviewLabel}>总练习</Text></View>
        </View>
      </View>

      <View className={styles.chartCard}>
        <Text className={styles.chartTitle}>近7天学习量</Text>
        <View className={styles.barChart}>
          {stats.weeklyData.map((item, i) => (
            <View key={i} className={styles.barItem}>
              <Text className={styles.barValue}>{item.count}</Text>
              <View className={styles.bar} style={{ height: `${(item.count / maxCount) * 180}rpx` }} />
              <Text className={styles.barLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.chartCard}>
        <Text className={styles.chartTitle}>科目学习进度</Text>
        <View className={styles.progressList}>
          {stats.subjects.map((subject, i) => (
            <View key={i} className={styles.progressItem}>
              <View className={styles.progressIcon} style={{ background: subject.color }}>📚</View>
              <View className={styles.progressInfo}>
                <View className={styles.progressHeader}>
                  <Text className={styles.progressName}>{subject.name}</Text>
                  <Text className={styles.progressCount}>{subject.count > 0 ? Math.round((subject.learned / subject.count) * 100) : 0}%</Text>
                </View>
                <View className={styles.progressBar}>
                  <View className={styles.progressFill} style={{ width: `${subject.count > 0 ? (subject.learned / subject.count) * 100 : 0}%`, background: subject.color }} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.radarCard}>
        <Text className={styles.radarTitle}>学习效率指标</Text>
        <View className={styles.radarGrid}>
          <View className={styles.radarItem}><Text className={styles.radarValue}>{stats.accuracy}</Text><Text className={styles.radarLabel}>正确率</Text></View>
          <View className={styles.radarItem}><Text className={styles.radarValue}>{stats.todayLearned}</Text><Text className={styles.radarLabel}>今日练习</Text></View>
          <View className={styles.radarItem}><Text className={styles.radarValue}>{stats.totalCards}</Text><Text className={styles.radarLabel}>总题库</Text></View>
        </View>
      </View>
    </ScrollView>
  )
}
