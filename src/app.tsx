import React, { useEffect } from 'react'
import { useDidShow, useDidHide } from '@tarojs/taro'
import { store } from './stores/useStore'
import { mockCards } from './services/mockData'
import './app.scss'

function App(props: { children: React.ReactNode }) {
  useEffect(() => {
    // 首次运行自动填入示例数据
    if (store.cards.length === 0) {
      store.initData(mockCards)
    }
  }, [])

  useDidShow(() => {})
  useDidHide(() => {})

  return props.children as React.ReactElement
}

export default App
