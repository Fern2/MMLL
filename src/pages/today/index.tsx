import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useStore } from '../../stores/useStore'
import { mockCards, mockStats } from '../../services/mockData'

const EXAM_DATE = new Date(new Date().getFullYear(), 11, 21)

export default function TodayPage() {
  const { cards } = useStore()
  const allCards = cards.length > 0 ? cards : mockCards
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calc = () => {
      const diff = EXAM_DATE.getTime() - Date.now()
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        })
      }
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [])

  const dueCards = allCards.filter(c => new Date(c.nextReview) <= new Date()).slice(0, 10)
  const learned = allCards.filter(c => c.successCount > 0).length
  const totalPercent = allCards.length > 0 ? Math.round((learned / allCards.length) * 100) : 0

  const getSubjectStats = () => {
    const subjects = ['专业课', '英语', '政治']
    const colors = ['#722ed1', '#0fc19c', '#165dff']
    return subjects.map((name, i) => {
      const subCards = allCards.filter(c => c.subject === name)
      return { name, total: subCards.length, learned: subCards.filter(c => c.successCount > 0).length, color: colors[i] }
    })
  }

  const subjectStats = getSubjectStats()

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case '专业课': return { icon: '📚', className: styles.iconDefault }
      case '英语': return { icon: '📖', className: styles.iconYy }
      case '政治': return { icon: '📝', className: styles.iconZyk }
      default: return { icon: '📄', className: styles.iconDefault }
    }
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.headerCard}>
        <View className={styles.countdown}>
          <Text className={styles.countdownLabel}>距离考研还有</Text>
        </View>
        <View className={styles.countdown}>
          <Text className={styles.countdownDays}>{countdown.days}</Text>
          <Text className={styles.countdownUnit}>天</Text>
        </View>
        <Text className={styles.examDate}>{EXAM_DATE.getFullYear()}年12月21日</Text>
        <View className={styles.progressSection}>
          <Text className={styles.progressTitle}>总体学习进度</Text>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${totalPercent}%` }} />
          </View>
          <Text className={styles.progressText}>已学习 {learned}/{allCards.length} 张卡片 ({totalPercent}%)</Text>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statCard}><Text className={styles.statValue}>{dueCards.length}</Text><Text className={styles.statLabel}>今日待复习</Text></View>
        <View className={styles.statCard}><Text className={styles.statValue}>{subjectStats[0]?.learned || 0}</Text><Text className={styles.statLabel}>专业课已学</Text></View>
        <View className={styles.statCard}><Text className={styles.statValue}>{(subjectStats[1]?.learned || 0) + (subjectStats[2]?.learned || 0)}</Text><Text className={styles.statLabel}>英语+政治</Text></View>
      </View>

      <View className={styles.taskCard}>
        <View className={styles.taskHeader}>
          <Text className={styles.taskTitle}>📅 SRS 今日到期</Text>
          <Text className={styles.taskCount}>共 {dueCards.length} 张</Text>
        </View>
        {dueCards.length > 0 ? (
          <View className={styles.taskList}>
            {dueCards.map(card => {
              const { icon, className } = getSubjectIcon(card.subject)
              return (
                <View key={card.id} className={styles.taskItem} onClick={() => Taro.navigateTo({ url: `/pages/study/index?cardId=${card.id}` })}>
                  <View className={styles.taskLeft}>
                    <View className={`${styles.taskIcon} ${className}`}><Text>{icon}</Text></View>
                    <View className={styles.taskInfo}>
                      <Text className={styles.taskQuestion}>{card.question}</Text>
                      <Text className={styles.taskMeta}>{card.subject} · {card.tag} · 等级{card.srsLevel}</Text>
                    </View>
                  </View>
                  <Text className={styles.taskArrow}>›</Text>
                </View>
              )
            })}
          </View>
        ) : (
          <View className={styles.emptyState}><Text className={styles.emptyIcon}>🎉</Text><Text className={styles.emptyText}>太棒了！今日没有待复习卡片</Text></View>
        )}
      </View>

      <View className={styles.startBtn} onClick={() => Taro.navigateTo({ url: '/pages/study/index' })}>
        {dueCards.length > 0 ? '开始今日学习' : '去资料库添加卡片'}
      </View>
    </ScrollView>
  )
}
