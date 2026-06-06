-- ==============================================
-- Supabase 数据库初始化脚本
-- 执行方式：在 Supabase Dashboard → SQL Editor 中运行
-- ==============================================

-- ==============================================
-- 0. 全局：关闭新建表的 RLS 自动启用
-- ==============================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- ==============================================
-- 1. 创建/修复 cards 表（题库）
-- ==============================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  subject VARCHAR(255),
  tag VARCHAR(255),
  srs_level INTEGER DEFAULT 0,
  next_review TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255)
);

-- 确保列存在（兼容已存在的旧表）
ALTER TABLE cards ADD COLUMN IF NOT EXISTS srs_level INTEGER DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS next_review TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS success_count INTEGER DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS fail_count INTEGER DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- ==============================================
-- 2. 创建/修复 practice_records 表（做题记录）
-- ==============================================
CREATE TABLE IF NOT EXISTS practice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID,
  user_id VARCHAR(255),
  is_correct BOOLEAN DEFAULT false,
  subject VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE practice_records ADD COLUMN IF NOT EXISTS card_id UUID;
ALTER TABLE practice_records ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE practice_records ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT false;
ALTER TABLE practice_records ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
ALTER TABLE practice_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_practice_records_user_id ON practice_records(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_records_created_at ON practice_records(created_at);

-- ==============================================
-- 3. 创建/修复 records 表（web 端使用）
-- ==============================================
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID,
  user_id VARCHAR(255),
  is_correct BOOLEAN DEFAULT false,
  subject VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE records ADD COLUMN IF NOT EXISTS card_id UUID;
ALTER TABLE records ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE records ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT false;
ALTER TABLE records ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
ALTER TABLE records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);

-- ==============================================
-- 4. 创建/修复 pdf_files 表
-- ==============================================
CREATE TABLE IF NOT EXISTS pdf_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  size BIGINT NOT NULL,
  user_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_pdf_files_user_id ON pdf_files(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_files_created_at ON pdf_files(created_at);

-- ==============================================
-- Storage Bucket 设置
-- ==============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pdf-files', 'pdf-files', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'pdf-files');

DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'pdf-files');

DROP POLICY IF EXISTS "Allow delete files" ON storage.objects;
CREATE POLICY "Allow delete files" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'pdf-files');

-- ==============================================
-- 5. pdf_studies 学习数据表（PDF背题模式）
-- ==============================================
CREATE TABLE IF NOT EXISTS pdf_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(500),
  blocks TEXT,
  masks TEXT,
  mask_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pdf_studies ADD COLUMN IF NOT EXISTS blocks TEXT;
ALTER TABLE pdf_studies ADD COLUMN IF NOT EXISTS masks TEXT;
ALTER TABLE pdf_studies ADD COLUMN IF NOT EXISTS mask_count INTEGER DEFAULT 0;
ALTER TABLE pdf_studies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_pdf_studies_pdf_id ON pdf_studies(pdf_id);

-- ==============================================
-- RLS 策略（所有表）
-- ==============================================

-- pdf_studies
ALTER TABLE pdf_studies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on pdf_studies" ON pdf_studies;
CREATE POLICY "Allow all on pdf_studies" ON pdf_studies
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- pdf_files
ALTER TABLE pdf_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on pdf_files" ON pdf_files;
CREATE POLICY "Allow all on pdf_files" ON pdf_files
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on cards" ON cards;
CREATE POLICY "Allow all on cards" ON cards
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- practice_records
ALTER TABLE practice_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on practice_records" ON practice_records;
CREATE POLICY "Allow all on practice_records" ON practice_records
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- records
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on records" ON records;
CREATE POLICY "Allow all on records" ON records
  FOR ALL TO anon USING (true) WITH CHECK (true);
