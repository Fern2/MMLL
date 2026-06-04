import { createClient } from '@supabase/supabase-js'

// Supabase 项目配置（已填写真实凭证）
const supabaseUrl = 'https://fjssiuxlregefvppfjyy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqc3NpdXhscmVnZWZ2cHBmanl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzk0NzAsImV4cCI6MjA5NjE1NTQ3MH0.8A5jaKTF0XUHOZqu3KG4qAAflcZBEJUEas5KhqpKD0Q'

export const supabase = createClient(supabaseUrl, supabaseKey)
