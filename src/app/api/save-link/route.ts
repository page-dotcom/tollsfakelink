import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Buat Koneksi Supabase Manual (Biar pasti nyambung)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Ambil Data
    const body = await req.json();
    const { url } = body;

    if (!url) return NextResponse.json({ success: false, error: 'URL kosong' }, { status: 400 });

    // 3. Bikin ID Pendek (5 Karakter)
    const shortId = Math.random().toString(36).substring(2, 7);

    // 4. Input ke Database (Tanpa Cek Auth/PIN - Langsung Tembak)
    const { error } = await supabase
      .from('links')
      .insert([{ id: shortId, url: url, clicks: 0 }]);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, shortId });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
