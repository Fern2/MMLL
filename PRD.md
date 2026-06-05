# 医学考研助手 Mini‑Program PRD

> **版本**：1.0 **编写日期**：2026‑06‑03 **作者**：Hermes Agent  
> **适用平台**：微信小程序（WX‑MP）  
> **技术栈**：微信云开发（CloudBase）+ 云函数（Node.js）  

---  

## 1️⃣ 项目概述

| 项目名称 | 医学考研助手 |
|----------|--------------|
| 目标 | 为医学考研学生提供 **资料管理 → PDF 导入 → 挖空出题 → 练习 → 错题本 → 模拟考试** 的完整学习闭环。 |
| 价值 | 1️⃣ 一站式学习平台。<br>2️⃣ 基于 SRS 的间隔重复记忆。<br>3️⃣ 零成本云端存储。 |
| 目标用户 | 医学本科/研究生、考研复习者，喜欢卡片记忆、碎片化学习。 |

---  

## 2️⃣ 页面结构（文件路径）

```
pages/
│
├─ today/               // 今日概览（首页）
│   ├─ today.wxml
│   └─ today.js
│
├─ cards/                // 资料库
│   ├─ cards.wxml
│   ├─ cards.js
│   └─ cards.wxss
│
├─ study/                // 单卡 / 批量学习
│   ├─ index.wxml        // 单卡学习
│   └─ index.js
│   ├─ batch.wxml        // 批量学习
│   └─ batch.js
│
├─ upload/               // PDF 上传 & 解析入口
│   ├─ index.wxml
│   └─ index.js
│
├─ paragraphs/           // 已解析段落列表
│   ├─ index.wxml
│   └─ index.js
│
├─ edit/                 // 段落编辑 & 挖空
│   ├─ index.wxml
│   └─ index.js
│
├─ questionBank/         // 题库
│   ├─ index.wxml
│   └─ index.js
│
├─ practice/             // 练习
│   ├─ index.wxml
│   └─ index.js
│
├─ wrongBook/            // 错题本
│   ├─ index.wxml
│   └─ index.js
│
├─ seed/                 // 示例卡片生成
│   ├─ seed.wxml
│   └─ seed.js
│
├─ stats/                // 统计页面
│   ├─ stats.wxml
│   └─ stats.js
│
├─ examSetup/            // 考试设置
│   ├─ index.wxml
│   └─ index.js
│
├─ examTake/             // 考试进行
│   ├─ index.wxml
│   └─ index.js
│
├─ examResult/           // 考试结果
│   ├─ index.wxml
│   └─ index.js
│
├─ import-pdf/           // 仅路由到 upload 页面
│   └─ import-pdf.js
│
└─ app.js / app.json     // 全局配置、云环境初始化
```

**TabBar（首页入口）**  

- 今日 → `/pages/today/today`  
- 资料库 → `/pages/cards/cards`  
- 统计 → `/pages/stats/stats`  

---  

## 3️⃣ 功能需求概览

| 页面 | 关键功能 |
|------|----------|
| **今日** | 天数倒计时、科目进度、SRS 今日到期卡片、未覆盖章节、启动今日刷题 |
| **资料库** | 卡片列表（科目筛选）、单卡学习入口、批量学习、示例卡生成、PDF 导入、添加卡片 |
| **单卡学习** | 查看卡片、标记“记住了/忘记了”，更新 SRS、成功/失败计数 |
| **批量学习** | 顺序浏览全部卡片，循环一次后 toast “已完成全部卡片” |
| **PDF 上传** | 文件大小 ≤ 5 MB，上传至云存储 → 调用 `uploadAndParsePDF` 云函数解析 |
| **段落列表** | 列出已解析段落（前 30 字符预览），点击进入编辑 |
| **段落编辑** | 手动插入 `______`，或点击 **“随机挖空”** 自动在段落中随机挑选 1‑3 处文字替换为 `______`，保存题目（调用 `saveQuestion` 云函数） |
| **题库** | 列表展示所有 `questions`，支持关键字搜索，点击可编辑或直接练习 |
| **练习** | 随机抽取 10 条题目，提交后统计正确数并写入 `practice_records` |
| **错题本** | 列出所有 `practice_records` 中 `correct < total` 的记录 |
| **示例卡生成** | 一键生成 5 条示例卡片 |
| **统计** | 总卡片数、今日已学、正确率、科目占比、章节覆盖率、近 7 天学习量（柱状图） |
| **考试设置** | 选择题目数量、时长，随机抽题生成 `exam_records` |
| **考试进行** | 计时、答题（同练习 UI），超时自动提交 |
| **考试结果** | 显示 total、correct、accuracy、开始/结束时间，返回首页 |
| **导入 PDF** | 仅路由页面，`onLoad` 自动跳转到 `/pages/upload` |

---  

## 4️⃣ 数据模型（云数据库集合）

| 集合 | 必要字段 | 备注 |
|------|----------------|------|
| **cards** | `_id`, `question`, `answer`, `subject` (专业课/英语/政治), `tag_id`/`tag_name` (可选), `srs_level`, `next_review_date`, `successCount`, `failCount`, `createdAt` | 记忆卡片 |
| **paragraphs** | `_id`, `fileID`, `index`, `text`, `createdAt` | PDF 解析后段落 |
| **questions** | `_id`, `pdfId`, `paragraphIndex`, `originalText`, `blankedText`, `blanks` (Array `{position, answer}`), `createdAt` | 挖空题 |
| **practice_records** | `_id`, `total`, `correct`, `accuracy`, `details` (每空的答题情况), `createdAt` | 练习记录 |
| **exam_records** | `_id`, `total`, `correct`, `accuracy`, `startTime`, `endTime`, `duration`, `questions` (题目数组), `completed`, `userId` | 考试记录 |
| **syllabus**（可选） | `_id`, `subject`, `name`, `totalParagraphs` | 大纲章节，用于统计覆盖率 |
| **users**（预留） | `_id`, `openid`, `nickname`, `avatarUrl` | 若后期需要登录关联 |

---  

## 5️⃣ 关键业务流程代码摘要

### 5.1 卡片库加载（`pages/cards/cards.js`）

```js
async _load() {
  const db = wx.cloud.database();
  try {
    const cardsRes = await db.collection('cards')
                             .limit(200)               // 防止一次性加载过多导致超时
                             .orderBy('createdAt','desc')
                             .get();
    const cards = cardsRes.data || [];

    const sylRes = await db.collection('syllabus').get();
    const syl = sylRes.data || [];

    const subj = this.data.curSubj;
    const list = subj === '全部' ? cards : cards.filter(c => c.subject===subj);

    list.forEach(c => {
      c._id = c._id||'';
      c.badgeCls = c.subject==='英语'?'b-en':
                   c.subject==='政治'?'b-pol':'b-zyk';
    });

    this.setData({ list, totalCards: cards.length, chapters: syl });
  } catch (err) {
    console.error('加载卡片失败', err);
    wx.showToast({ title:'加载卡片失败', icon:'none' });
  }
}
```

### 5.2 保存卡片（`saveCard`）

```js
saveCard() {
  const d = this.data;
  if (!d.q.trim()) { wx.showToast({title:'请输入问题',icon:'none'}); return; }
  if (!d.a.trim()) { wx.showToast({title:'请输入答案',icon:'none'}); return; }

  const subj = d.subjects[d.subjIdx];
  const tag  = d.chapters[d.chIdx] || { _id:'', name:'未分类' };

  const db = wx.cloud.database();
  const newCard = {
    question: d.q.trim(),
    answer: d.a.trim(),
    subject: subj,
    tag_id: tag._id,
    tag_name: tag.name,
    srs_level: 1,
    next_review_date: this._today(),
    successCount: 0,
    failCount: 0,
    createdAt: new Date().toISOString()
  };

  db.collection('cards').add({ data:newCard })
    .then(()=>{ wx.showToast({title:'已添加',icon:'success'}); this.hideModal(); this._load(); })
    .catch(err=>{ console.error('saveCard error',err); wx.showToast({title:'保存失败',icon:'none'}); });
}
```

### 5.3 PDF 解析云函数 `uploadAndParsePDF`

```js
exports.main = async (event) => {
  const { fileID } = event;
  if (!fileID) return { error:'fileID is required' };

  const cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV, timeout:300000 });

  const pdfParse = require('pdf-parse');
  const fs = require('fs'), path = require('path');

  const { fileContent } = await cloud.downloadFile({ fileID });
  const tmpPath = path.join('/tmp', `${Date.now()}.pdf`);
  fs.writeFileSync(tmpPath, fileContent);

  const data = fs.readFileSync(tmpPath);
  const pdfData = await pdfParse(data);
  const paragraphs = splitIntoParagraphs(pdfData.text); // ≤500字符切分

  const db = cloud.database();
  const batch = db.batch();
  paragraphs.forEach((p,i)=>batch.collection('paragraphs')
                                 .add({data:{fileID,index:i,text:p,createdAt:new Date()}}));
  await batch.commit();

  return { success:true, paragraphCount: paragraphs.length, pageCount: pdfData.numpages };
};
```

### 5.4 保存题目云函数 `saveQuestion`

```js
exports.main = async (event) => {
  const { pdfId, paragraphIndex, originalText, blankedText } = event;
  if (!pdfId || !originalText || !blankedText) return { error:'Missing fields' };

  const placeholder = '______';
  const blanks = [];
  let start = 0;
  while (true) {
    const pos = blankedText.indexOf(placeholder, start);
    if (pos===-1) break;
    const left  = originalText.slice(Math.max(0,pos-10)).match(/[\u4e00-\u9fa5\w]+$/);
    const right = originalText.slice(pos+placeholder.length).match(/^[\u4e00-\u9fa5\w]+/);
    blanks.push({ position:pos, answer:(left?left[0]:'')+(right?right[0]:'') });
    start = pos + placeholder.length;
  }

  const db = cloud.database();
  await db.collection('questions').add({
    data:{ pdfId, paragraphIndex, originalText, blankedText, blanks, createdAt:new Date() }
  });
  return { success:true };
};
```

### 5.5 段落编辑页面（`pages/edit/index.wxml` & `index.js`）

**WXML（新增“随机挖空”按钮）**

```xml
<view class="edit-section">
  <text class="section-title">添加 “______” 空格</text>
  <textarea class="edit-area"
            bindinput="onInput"
            value="{{blankedText}}"
            placeholder="在此编辑并插入占位"/>
  <!-- 随机挖空按钮 -->
  <button class="go-btn"
          bindtap="randomBlank"
          style="margin-top:20rpx;">随机挖空</button>
</view>

<button class="go-btn" bindtap="saveQuestion">保存题目</button>
```

**JS（实现 `randomBlank`）**

```js
Page({
  data:{ paragraphId:'', paragraph:null, blankedText:'' },

  onLoad(options){ /* load paragraph */ },

  async loadParagraph(){ /* db fetch */ },

  onInput(e){ this.setData({ blankedText:e.detail.value }); },

  /** 随机挖空：在原文中随机挑选 1‑3 处文字替换为 '______' */
  randomBlank(){
    const paragraph = this.data.paragraph;
    if (!paragraph) return;
    const original = paragraph.text;
    if (!original) return;

    // 最多 3 处空，且不超过文本长度的 1/10
    const maxBlanks = Math.min(3, Math.max(1, Math.floor(original.length/50)));
    const blanksCount = Math.max(1, Math.floor(Math.random()*maxBlanks)+1);

    let result = original;
    const used = []; // 已占用区间

    for (let i=0;i<blanksCount;i++){
      let start,len,attempts=0;
      do{
        start = Math.floor(Math.random()*Math.max(0,result.length-4));
        len = 2 + Math.floor(Math.random()*3); // 2‑4字符
        const overlap = used.some(r=>!(start+len<=r.start||start>=r.start+r.len));
        if (!overlap) break;
        attempts++;
      }while(attempts<10);
      if (attempts>=10) break;
      used.push({start,len});
      result = result.substring(0,start)+'______'+result.substring(start+len);
    }
    this.setData({ blankedText:result });
  },

  async saveQuestion(){
    const { paragraph,blankedText } = this.data;
    if (!paragraph) return;
    try{
      const cfRes = await wx.cloud.callFunction({
        name:'saveQuestion',
        data:{ pdfId:paragraph.fileID,
               paragraphIndex:paragraph.index,
               originalText:paragraph.text,
               blankedText }
      });
      if (cfRes.result.error) throw new Error(cfRes.result.error);
      wx.showToast({title:'题目保存成功',icon:'success'});
      wx.navigateBack(); // 回到段落列表
    }catch(err){
      console.error('saveQuestion error',err);
      wx.showToast({title:'保存题目失败',icon:'none'});
    }
  }
});
```

---  

## 6️⃣ 功能需求（User Stories & Acceptance）

| # | 用户故事 | 验收标准 |
|---|----------|----------|
| 1 | 查看今日倒计时、科目进度、SRS 今日到期卡片 | 首页展示天数、进度环、卡片列表，点击卡片直接进入单卡学习 |
| 2 | 将 PDF 导入系统并自动切分段落 | 上传 ≤ 5 MB → 云函数解析 → 段落列表显示 |
| 3 | 在段落编辑页手动或随机标记 `______` 并保存为可练习题目 | 手动编辑或点击 “随机挖空”，编辑框出现 `______`；点击 “保存题目” 后 `questions` 集合新增记录 |
| 4 | 在题库中搜索关键字快速定位题目 | 输入关键词后列表即时过滤，仅显示匹配 `blankedText` 项 |
| 5 | 随机抽取 10 题进行练习并即时得到分数 | 练习页面抽题、提交后 toast 显示 “X/Y 正确”，记录写入 `practice_records` |
| 6 | 查看并复习错题 | 错题本展示所有 `practice_records` 中 `correct < total` 的记录 |
| 7 | 设置模拟考试（题量、时长），完成后查看详细成绩 | 考试设置 → 随机抽题 → 考试页面计时答题 → 完成后结果页显示 total、correct、accuracy、开始/结束时间 |
| 8 | 在卡片库快速添加新卡片 | 点击 “+” → 弹出表单 → 填写后保存至 `cards`，列表即时刷新 |
| 9 | 在卡片库查看每张卡片的 SRS 等级、下次复习日期、成功/失败计数 | 卡片列表中展示这些字段 |
|10 | 今日快速进入需要复习的 SRS 卡片 | 首页 “SRS 今日到期” 区域列出符合日期的卡片，点击直接学习 |

---  

## 7️⃣ 非功能需求（NFR）

| 项目 | 要求 |
|------|------|
| **性能** | 页面首次渲染 ≤ 2 s；PDF 解析云函数超时 300 s，内存 ≥ 256 MB（如需可调至 512 MB） |
| **可用性** | 网络或云函数错误统一捕获并通过 `wx.showToast` 提示 |
| **安全** | 仅当前小程序的云环境可读写，数据受微信云开发权限控制 |
| **兼容性** | 支持 iOS、Android 微信客户端，使用 Flex 布局适配 320‑480 dp 设备 |
| **可靠性** | 关键写入使用 `await` 并捕获异常，确保不出现数据丢失 |
| **可维护性** | 所有业务逻辑封装在对应 `Page({})`，云函数独立，公共工具抽离至 `utils/` |
| **可扩展性** | 预留 `tag_id/tag_name`、`syllabus`，便于后期章节标签、排行榜等功能 |

---  

## 8️⃣ 部署与运行指南

1. **创建云环境**：微信公众平台 → 云开发 → 新建环境，记录 Env ID（如 `cloudbase-d9gg0xulx6d7b1283`）。  
2. **全局初始化**（已在 `app.js` 中写入）  
   ```js
   wx.cloud.init({ env: 'cloudbase-d9gg0xulx6d7b1283', traceUser:true });
   ```  
3. **部署云函数**  
   - 在微信开发者工具左侧 “云函数” → 右键 `uploadAndParsePDF`、`saveQuestion` → “上传并部署”。  
   - 设置 **超时 300 s**，**内存 ≥ 256 MB**（如有需要可调高）。  
4. **本地调试**  
   - 打开微信开发者工具 → “导入项目” → 选择项目根目录 → “编译”（Ctrl + R）。  
5. **数据初始化（可选）**  
   - 如需章节统计，手动创建 `syllabus` 集合并填入章节数据。  
6. **常用调试**  
   - 云函数日志：工具左侧 “云函数” → 选中函数 → “日志”。  
   - 前端网络面板：`wx.request`、`wx.cloud.callFunction` 结果可在开发者工具的 Console 中观察。  

---  

## 9️⃣ 未来迭代路线（Roadmap）

| 版本 | 功能 | 备注 |
|------|------|------|
| **v1.1** | 章节/知识点标签 | 让卡片关联 `syllabus`，卡片库提供章节筛选 |
| **v1.2** | 错题本细化 | 记录每个空的错误答案，提供“一键复习” |
| **v1.3** | 考试报告导出 | 生成 PDF/图片报告，可分享 |
| **v1.4** | 排行榜与学习激励 | 同学间学习进度对比、积分系统 |
| **v2.0** | 跨平台（Web、支付宝小程序等） | 使用 Taro/UniApp 迁移至多端 |
| **v2.1** | AI 自动出题 | 接入 LLM（如 GPT‑4）自动从段落生成高质量填空题 |

---  

## 10️⃣ 结束语

本 PRD 完整列出了 **医学考研助手** 小程序的功能需求、页面交互、数据模型、关键实现代码、非功能要求以及部署步骤。已去除所有 UI 颜色与布局细节，页面 UI 将由后续设计团队按照项目统一规范完成。

如需进一步细化某个子功能或调整数据结构，请在本文件基础上增补章节即可。祝项目顺利实现，帮助考研学生高效复习 🚀!