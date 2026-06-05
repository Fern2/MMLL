const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 10087;

const SUPABASE_URL = 'https://fjssiuxlregefvppfjyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqc3NpdXhscmVnZWZ2cHBmanl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzk0NzAsImV4cCI6MjA5NjE1NTQ3MH0.8A5jaKTF0XUHOZqu3KG4qAAflcZBEJUEas5KhqpKD0Q';

async function parsePdf(pdfData) {
  const pdf = await import('pdf-parse');
  const { text } = await pdf.default(pdfData);
  const lines = text.split('\n').filter(line => line.trim());
  
  const blocks = [];
  let currentBlock = [];
  
  lines.forEach(line => {
    if (line.trim().length < 5) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  });
  
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }
  
  return blocks;
}

async function saveStudyData(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pdf_studies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Save failed');
  return await res.json();
}

async function getStudyData(pdfId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pdf_studies?pdf_id=eq.${encodeURIComponent(pdfId)}`, {
    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.length > 0 ? data[0] : null;
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF遮挡背题</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fa; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header h1 { font-size: 24px; color: #333; }
    .mode-switch { display: flex; gap: 8px; }
    .mode-btn { padding: 8px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .mode-btn.active { background: #6C5CE7; color: white; }
    .mode-btn:not(.active) { background: white; color: #666; }
    
    /* Upload Area */
    .upload-area { border: 2px dashed #ddd; border-radius: 16px; padding: 60px 20px; text-align: center; cursor: pointer; margin-bottom: 20px; }
    .upload-area:hover { border-color: #6C5CE7; background: #f5f3ff; }
    .upload-area i { font-size: 48px; margin-bottom: 16px; }
    #fileInput { display: none; }
    
    /* PDF Content */
    .content-area { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .block { margin-bottom: 20px; padding: 16px; border-radius: 12px; background: #fafafa; position: relative; }
    .block-text { font-size: 16px; line-height: 1.8; color: #333; word-break: break-all; }
    
    /* Mask Styles */
    .mask { 
      position: absolute; 
      background: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
      border-radius: 4px;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s;
      opacity: 0.9;
    }
    .mask:hover { opacity: 0.7; }
    .mask.revealed { opacity: 0.3; }
    .mask::after {
      content: '点击显示';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      white-space: nowrap;
    }
    .mask.revealed::after {
      content: '点击隐藏';
    }
    
    /* Toolbar */
    .toolbar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; background: white; padding: 12px 24px; border-radius: 50px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .tool-btn { padding: 10px 20px; border: none; border-radius: 25px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .tool-btn.add { background: #6C5CE7; color: white; }
    .tool-btn.save { background: #00b42a; color: white; }
    .tool-btn.clear { background: #f53f3f; color: white; }
    .tool-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    /* Selection Mode */
    .selection-hint { position: fixed; top: 20px; right: 20px; background: #ffc107; color: #333; padding: 12px 20px; border-radius: 8px; font-size: 14px; display: none; }
    .selection-hint.show { display: block; }
    
    /* Stats */
    .stats { display: flex; gap: 20px; margin-bottom: 20px; }
    .stat { background: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .stat-value { font-size: 24px; font-weight: 700; color: #6C5CE7; }
    .stat-label { font-size: 12px; color: #999; margin-top: 4px; }
    
    /* Toast */
    .toast { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; opacity: 0; transition: opacity 0.3s; z-index: 100; }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 PDF遮挡背题</h1>
      <div class="mode-switch">
        <button class="mode-btn active" onclick="setMode('edit')">编辑模式</button>
        <button class="mode-btn" onclick="setMode('study')">背题模式</button>
      </div>
    </div>
    
    <div class="stats" id="stats" style="display: none;">
      <div class="stat">
        <div class="stat-value" id="blockCount">0</div>
        <div class="stat-label">段落数</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="maskCount">0</div>
        <div class="stat-label">遮挡数</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="revealCount">0</div>
        <div class="stat-label">已显示</div>
      </div>
    </div>
    
    <div class="upload-area" id="uploadArea">
      <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
      <div style="font-size: 18px; margin-bottom: 8px;">点击或拖拽上传PDF文件</div>
      <div style="color: #999; font-size: 14px;">支持PDF格式，大小不限</div>
    </div>
    <input type="file" id="fileInput" accept=".pdf">
    
    <div class="content-area" id="contentArea" style="display: none;"></div>
    
    <div class="toolbar" id="toolbar" style="display: none;">
      <button class="tool-btn add" id="addMaskBtn" onclick="startSelection()">
        ✏️ 添加遮挡
      </button>
      <button class="tool-btn save" onclick="saveProgress()">
        💾 保存进度
      </button>
      <button class="tool-btn clear" onclick="clearAllMasks()">
        🗑️ 清除遮挡
      </button>
    </div>
    
    <div class="selection-hint" id="selectionHint">
      👆 拖动鼠标选择要遮挡的文本区域
    </div>
    
    <div class="toast" id="toast"></div>
  </div>

  <script>
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const contentArea = document.getElementById('contentArea');
    const toolbar = document.getElementById('toolbar');
    const stats = document.getElementById('stats');
    const selectionHint = document.getElementById('selectionHint');
    const toast = document.getElementById('toast');
    
    let currentMode = 'edit';
    let pdfContent = [];
    let masks = [];
    let pdfId = '';
    let isSelecting = false;
    let selectionStart = null;
    
    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
    
    function setMode(mode) {
      currentMode = mode;
      document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      if (mode === 'study') {
        masks.forEach(mask => {
          const el = document.getElementById('mask-' + mask.id);
          if (el) el.classList.remove('revealed');
        });
        document.getElementById('addMaskBtn').disabled = true;
        updateRevealCount();
      } else {
        document.getElementById('addMaskBtn').disabled = false;
      }
    }
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = '#6C5CE7'; });
    uploadArea.addEventListener('dragleave', () => uploadArea.style.borderColor = '#ddd');
    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.style.borderColor = '#ddd';
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    });
    
    fileInput.addEventListener('change', e => {
      if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
    
    async function handleFile(file) {
      if (file.type !== 'application/pdf') {
        showToast('请选择PDF文件');
        return;
      }
      
      showToast('正在解析PDF...');
      
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch('/api/parse', { method: 'POST', body: formData });
      const data = await response.json();
      
      if (data.success) {
        pdfId = data.pdfId;
        pdfContent = data.blocks;
        loadSavedMasks();
        renderContent();
      } else {
        showToast('解析失败: ' + data.message);
      }
    }
    
    async function loadSavedMasks() {
      const response = await fetch('/api/load?pdfId=' + encodeURIComponent(pdfId));
      const data = await response.json();
      if (data.success && data.data) {
        masks = data.data.masks || [];
      }
    }
    
    function renderContent() {
      uploadArea.style.display = 'none';
      contentArea.style.display = 'block';
      toolbar.style.display = 'flex';
      stats.style.display = 'flex';
      
      contentArea.innerHTML = pdfContent.map((block, blockIndex) => {
        return `<div class="block" id="block-${blockIndex}" data-block="${blockIndex}">
          <div class="block-text">${escapeHtml(block)}</div>
        </div>`;
      }).join('');
      
      masks.forEach(renderMask);
      updateStats();
    }
    
    function escapeHtml(text) {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    function renderMask(mask) {
      const blockEl = document.getElementById('block-' + mask.blockIndex);
      if (!blockEl) return;
      
      const textEl = blockEl.querySelector('.block-text');
      const rect = textEl.getBoundingClientRect();
      
      const maskEl = document.createElement('div');
      maskEl.className = 'mask' + (mask.revealed ? ' revealed' : '');
      maskEl.id = 'mask-' + mask.id;
      maskEl.style.left = mask.x + 'px';
      maskEl.style.top = mask.y + 'px';
      maskEl.style.width = mask.width + 'px';
      maskEl.style.height = mask.height + 'px';
      maskEl.addEventListener('click', () => toggleMask(mask.id));
      
      blockEl.appendChild(maskEl);
    }
    
    function toggleMask(maskId) {
      const mask = masks.find(m => m.id === maskId);
      if (!mask) return;
      
      mask.revealed = !mask.revealed;
      const el = document.getElementById('mask-' + maskId);
      if (el) el.classList.toggle('revealed');
      
      updateRevealCount();
    }
    
    function startSelection() {
      isSelecting = true;
      selectionHint.classList.add('show');
      
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mouseup', onMouseUp);
    }
    
    function onMouseDown(e) {
      if (!isSelecting) return;
      const target = e.target;
      const blockEl = target.closest('.block');
      if (!blockEl) return;
      
      const rect = blockEl.getBoundingClientRect();
      selectionStart = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        blockIndex: parseInt(blockEl.dataset.block)
      };
      
      document.addEventListener('mousemove', onMouseMove);
    }
    
    function onMouseMove(e) {
      if (!selectionStart) return;
      
      const blockEl = document.getElementById('block-' + selectionStart.blockIndex);
      const rect = blockEl.getBoundingClientRect();
      
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      
      const x = Math.min(selectionStart.x, endX);
      const y = Math.min(selectionStart.y, endY);
      const width = Math.abs(endX - selectionStart.x);
      const height = Math.abs(endY - selectionStart.y);
      
      if (width > 10 && height > 10) {
        const mask = {
          id: Date.now().toString(36),
          blockIndex: selectionStart.blockIndex,
          x, y, width, height,
          revealed: false
        };
        
        masks.push(mask);
        renderMask(mask);
        
        selectionStart = null;
        updateStats();
      }
    }
    
    function onMouseUp() {
      isSelecting = false;
      selectionHint.classList.remove('show');
      selectionStart = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    }
    
    async function saveProgress() {
      showToast('正在保存...');
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId, masks })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('保存成功！');
      } else {
        showToast('保存失败: ' + data.message);
      }
    }
    
    function clearAllMasks() {
      masks = [];
      document.querySelectorAll('.mask').forEach(el => el.remove());
      updateStats();
      showToast('已清除所有遮挡');
    }
    
    function updateStats() {
      document.getElementById('blockCount').textContent = pdfContent.length;
      document.getElementById('maskCount').textContent = masks.length;
      updateRevealCount();
    }
    
    function updateRevealCount() {
      const revealed = masks.filter(m => m.revealed).length;
      document.getElementById('revealCount').textContent = revealed;
    }
  </script>
</body>
</html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (req.url === '/api/parse' && req.method === 'POST') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      
      const boundary = req.headers['content-type'].split('boundary=')[1];
      const parts = buffer.toString().split('--' + boundary);
      let pdfData = null;
      
      for (const part of parts) {
        if (part.includes('application/pdf')) {
          const start = part.indexOf('\r\n\r\n') + 4;
          const end = part.lastIndexOf('\r\n--');
          const partStart = buffer.toString().indexOf(part);
          pdfData = buffer.slice(partStart + start, partStart + end);
          break;
        }
      }
      
      if (!pdfData) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '未找到PDF文件' }));
        return;
      }
      
      const blocks = await parsePdf(pdfData);
      const pdfId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, pdfId, blocks }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }

  if (req.url.startsWith('/api/save') && req.method === 'POST') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const data = JSON.parse(chunks.join(''));
      
      await saveStudyData({
        pdf_id: data.pdfId,
        masks: JSON.stringify(data.masks),
        updated_at: new Date().toISOString()
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }

  if (req.url.startsWith('/api/load')) {
    try {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const pdfId = urlParams.get('pdfId');
      
      if (!pdfId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '缺少pdfId' }));
        return;
      }
      
      const data = await getStudyData(pdfId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: data ? { masks: JSON.parse(data.masks || '[]') } : null 
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`PDF遮挡背题服务运行在 http://localhost:${PORT}`);
});
