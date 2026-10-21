/**
 * Supabase Keep-Alive Script
 * รันคำสั่งนี้เพื่อ Ping Supabase ป้องกันไม่ให้โครงการหลับ (Pause)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iccvbxlfntrkqzdhgzqn.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljY3ZieGxmbnRya3F6ZGhnenFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNDc5OTMsImV4cCI6MjEwMDYyMzk5M30.HIFaJCqKRg2y7ZnPK0wuEjoZdXe-GMSS3rsl_kjv-y4';

async function pingSupabase() {
  console.log(`[Keep-Alive] 🚀 Pinging Supabase at: ${SUPABASE_URL}`);
  const startTime = Date.now();

  try {
    const cleanUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const endpoint = `${cleanUrl}/rest/v1/gender_list?select=id&limit=1`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    const elapsed = Date.now() - startTime;

    if (res.ok) {
      console.log(`[Keep-Alive] ✅ Supabase is ALIVE! (Status: ${res.status}, Time: ${elapsed}ms)`);
      const data = await res.json();
      console.log(`[Keep-Alive] 📦 Response:`, data);
    } else {
      const errText = await res.text();
      console.error(`[Keep-Alive] ❌ HTTP Error ${res.status}:`, errText);
    }
  } catch (err) {
    console.error(`[Keep-Alive] ❌ Network Error:`, err.message);
  }
}

pingSupabase();
