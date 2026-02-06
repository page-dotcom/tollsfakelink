import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

function generateRandomId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    const authHeader = request.headers.get('authorization');
    const userAgent = request.headers.get('user-agent') || '';

    // Ambil PIN dari Environment Variable Vercel
    const PIN_RAHASIA = process.env.MY_SECRET_PIN;

    // --- LOGIKA SATPAM API ---
    // Jika akses datang dari skrip (Termux/Python), wajib cek PIN
    if (userAgent.includes('python-requests') || authHeader) {
      if (authHeader !== `Bearer ${PIN_RAHASIA}`) {
        return NextResponse.json(
          { success: false, error: 'Akses Ditolak: PIN Salah atau Tidak Ada' }, 
          { status: 401 }
        );
      }
    }

    if (!url) {
      return NextResponse.json({ error: 'URL harus diisi' }, { status: 400 });
    }

    const shortId = generateRandomId(6);

    const { data, error } = await supabase
      .from('links')
      .insert([{ id: shortId, url: url }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, shortId, url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
