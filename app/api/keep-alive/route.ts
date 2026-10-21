import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // ทำการ query ตารางขนาดเล็กเพื่อกระตุ้น Database ให้ active อยู่เสมอ
    const { data, error } = await supabase
      .from('gender_list')
      .select('id')
      .limit(1);

    const duration = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase is kept alive successfully!',
      timestamp: new Date().toISOString(),
      responseTimeMs: duration,
      dataSample: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
