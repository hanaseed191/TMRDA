import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iccvbxlfntrkqzdhgzqn.supabase.co';
// Strip trailing slashes and rest/v1
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljY3ZieGxmbnRya3F6ZGhnenFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNDc5OTMsImV4cCI6MjEwMDYyMzk5M30.HIFaJCqKRg2y7ZnPK0wuEjoZdXe-GMSS3rsl_kjv-y4';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
