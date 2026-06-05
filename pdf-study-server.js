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
  
  if (currentBlock.length > 0) blocks.push(currentBlock.join('\n'));
  return blocks;
}

async function saveStudyData(data) {
  const existing = await getStudyByPdfId(data.pdf_id);
  
  if (existing) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pdf_studies?id=eq.${existing.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        blocks: data.blocks,
        masks: data.masks,
        updated_at: new Date().toISOString()
      })
    });
    return await res.json();
  } else {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pdf_studies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        pdf_id: data.pdf_id,
        file_name: data.file_name,
        blocks: data.blocks,
        masks: data.masks,
        mask_count: JSON.parse(data.masks).length,
        updated_at: new Date().toISOString()
      })
    });
    return await res.json();
  }
}

async function getStudyByPdfId(pdfId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pdf_studies?pdf_id=eq.${encodeURIComponent(pdfId)}`, {
    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.length > 0 ? data[0] : null;
}

async function getAllStudies() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pdf_studies?select=id,pdf_id,file_name,mask_count,updated_at&order=updated_at.desc`, {
    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) return [];
  return await res.json();
}

async function deleteStudy(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pdf_studies?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  return res.ok;
}

const server = http.createServer(async (req, res) => {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/') {
    const html = fs.readFileSync('./pdf-study.html', 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (req.url === '/api/parse' && req.method === 'POST') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('multipart/form-data')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '无效的内容类型' }));
        return;
      }
      
      const boundary = contentType.split('boundary=')[1];
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
      console.error('解析错误:', err);
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
        file_name: data.fileName,
        blocks: JSON.stringify(data.blocks),
        masks: JSON.stringify(data.masks),
        mask_count: data.masks.length
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error('保存错误:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }

  if (req.url.startsWith('/api/list')) {
    try {
      const files = await getAllStudies();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, files }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }

  if (req.url.startsWith('/api/get')) {
    try {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const pdfId = urlParams.get('pdfId');
      
      if (!pdfId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '缺少pdfId' }));
        return;
      }
      
      const data = await getStudyByPdfId(pdfId);
      
      if (data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          blocks: JSON.parse(data.blocks || '[]'), 
          masks: JSON.parse(data.masks || '[]') 
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '文件未找到' }));
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
    return;
  }

  if (req.url.startsWith('/api/delete') && req.method === 'DELETE') {
    try {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const id = urlParams.get('id');
      
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '缺少id' }));
        return;
      }
      
      const success = await deleteStudy(id);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success }));
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
  console.log('PDF遮挡背题服务运行在 http://localhost:' + PORT);
});