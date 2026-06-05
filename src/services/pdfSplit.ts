import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { supabase } from './supabase';

/**
 * 简单的 PDF 拆分服务：读取 PDF 文本，按双换行分割为卡片条目，
 * 将每条插入 Supabase 表 `cards`（字段需与表结构保持一致）。
 * 仅作演示，实际生产请根据业务自行实现更完善的分割逻辑。
 */
async function splitPdf(filePath: string) {
  const data = fs.readFileSync(filePath);
  const { text } = await pdf(data);
  // 以两个换行符拆分为块，每块视为一张卡片的 "question\nanswer"，
  // 这里简单地把首行作为 question，剩余行作为 answer。
  const blocks = text.split(/\n{2,}/).filter(Boolean);
  const cards = blocks.map((block, idx) => {
    const lines = block.split('\n').filter(Boolean);
    const question = lines[0] ?? `Question ${idx + 1}`;
    const answer = lines.slice(1).join('\n');
    return {
      id: `${Date.now()}_${idx}`,
      question,
      answer,
      subject: 'PDF导入',
      tag: 'auto',
      srsLevel: 1,
      nextReview: new Date().toISOString().split('T')[0],
      successCount: 0,
      failCount: 0,
    };
  });
  // 插入 Supabase
  const { error } = await supabase.from('cards').insert(cards);
  if (error) {
    console.error('插入卡片失败', error);
  } else {
    console.log(`成功插入 ${cards.length} 条卡片`);
  }
}

// CLI 使用：node pdfSplit.js <pdf文件路径>
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('请提供 PDF 文件路径');
  process.exit(1);
}
const pdfPath = path.resolve(args[0]);
splitPdf(pdfPath).catch((e) => {
  console.error('处理 PDF 时出错', e);
});
