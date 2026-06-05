export default defineAppConfig({
  pages: [
    'pages/today/index',
    'pages/cards/index',
    'pages/stats/index',
    'pages/study/index',
    'pages/practice/index',
    'pages/wrongBook/index',
    'pages/upload/index',
    'pages/paragrapgs/index',
    'pages/edit/index',
    'pages/questionBank/index',
    'pages/examSetup/index',
    'pages/examTake/index',
    'pages/examResult/index',
    'pages/seed/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165dff',
    navigationBarTitleText: '医学考研助手',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#165dff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/today/index',
        text: '今日'
      },
      {
        pagePath: 'pages/cards/index',
        text: '资料库'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计'
      }
    ]
  }
})
