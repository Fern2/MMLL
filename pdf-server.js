const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 10086;

const SUPABASE_URL = 'https://fjssiuxlregefvppfjyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqc3NpdXhscmVnZWZ2cHBmanl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzk0NzAsImV4cCI6MjA5NjE1NTQ3MH0.8A5jaKTF0XUHOZqu3KG4qAAflcZBEJUEas5KhqpKD0Q';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function splitPdfToCards(pdfData) {
  const pdf = await import('pdf-parse');
  const { text } = await pdf.default(pdfData);
  const blocks = text.split(/\n{2,}/).filter(b => b.trim().length > 10);
  
  const cards = [];
  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split('\n').filter(l => l.trim());
    const question = lines[0]?.trim() || 'Question ' + (i + 1);
    const answer = lines.slice(1).join('\n').trim() || '(No answer)';
    const id = generateUUID();
    
    cards.push({
      id,
      question,
      answer,
      subject: 'PDF Import',
      tag: 'auto',
      srs_level: 1,
      next_review: new Date().toISOString().split('T')[0],
      success_count: 0,
      fail_count: 0
    });
  }
  return cards;
}

async function saveCardsToSupabase(cards) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(cards)
  });
  if (!res.ok) throw new Error('Save failed');
  return await res.json();
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PDF Split Demo</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
    .card { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 20px; }
    .upload-area { border: 2px dashed #ddd; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s; }
    .upload-area:hover { border-color: #4f46e5; background: #f5f3ff; }
    #fileInput { display: none; }
    .btn { background: #4f46e5; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px; }
    .btn:disabled { opacity: 0.5; }
    .result { margin-top: 20px; padding: 15px; border-radius: 8px; display: none; }
    .success { background: #e8f5e9; color: #2e7d32; }
    .error { background: #ffebee; color: #c62828; }
    .preview { margin-top: 15px; max-height: 300px; overflow-y: auto; }
    .preview-item { background: white; padding: 10px; margin-bottom: 8px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📄 PDF Split Demo</h1>
    <div class="upload-area" id="uploadArea">
      <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
      <div>Click or drag file here</div>
      <div style="color: #999; font-size: 14px; margin-top: 8px;">PDF files only</div>
    </div>
    <input type="file" id="fileInput" accept=".pdf">
    <div style="text-align: center;">
      <button class="btn" id="uploadBtn" disabled>Upload & Split</button>
    </div>
  </div>
  <div class="result" id="result"></div>

  <script>
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const result = document.getElementById('result');
    let selectedFile = null;

    uploadArea.onclick = () => fileInput.click();
    uploadArea.ondragover = (e) => { e.preventDefault(); uploadArea.style.borderColor = '#4f46e5'; };
    uploadArea.ondragleave = () => { uploadArea.style.borderColor = '#ddd'; };
    uploadArea.ondrop = (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#ddd';
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    };

    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) handleFile(e.target.files[0]);
    };

    function handleFile(file) {
      if (file.type !== 'application/pdf') {
        alert('Please select PDF file');
        return;
      }
      selectedFile = file;
      uploadBtn.disabled = false;
      uploadArea.innerHTML = '<div style=\"font-size: 24px; margin-bottom: 8px;\">✅</div><div>Selected: ' + file.name + '</div>';
    }

    uploadBtn.onclick = async () => {
      if (!selectedFile) return;
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Processing...';
      result.style.display = 'none';

      const formData = new FormData();
      formData.append('pdf', selectedFile);

      try {
        const response = await fetch('/api/split', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (data.success) {
          result.className = 'result success';
          result.innerHTML = '<strong>Success!</strong><br>Created ' + data.count + ' flashcards and saved to database.<br>' +
            '<div class=\"preview\">' + data.cards.slice(0, 3).map((c, i) => 
              '<div class=\"preview-item\"><strong>Q' + (i+1) + ':</strong> ' + 
              c.question.substring(0, 40) + '...</div>'
            ).join('') + '</div>';
        } else {
          result.className = 'result error';
          result.textContent = 'Error: ' + (data.message || 'Unknown error');
        }
      } catch (err) {
        result.className = 'result error';
        result.textContent = 'Request failed: ' + err.message;
      }

      result.style.display = 'block';
      uploadBtn.textContent = 'Upload & Split';
      uploadBtn.disabled = false;
    };
  </script>
</body>
</html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (req.url === '/api/split' && req.method === 'POST') {
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
        res.end(JSON.stringify({ success: false, message: 'No PDF found' }));
        return;
      }

      const cards = await splitPdfToCards(pdfData);
      await saveCardsToSupabase(cards);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: cards.length, cards }));
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
  console.log('PDF Split Service running on http://localhost:' + PORT);
});
