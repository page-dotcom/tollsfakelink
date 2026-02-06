import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

// Fungsi untuk membuat ID acak 6 karakter
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
    const body = await request.json();
    const { url } = body;
    
    // 1. Ambil Header Keamanan
    const authHeader = request.headers.get('authorization');
    const userAgent = request.headers.get('user-agent') || '';
    
    // 2. Ambil PIN dari Environment Variable Vercel
    const PIN_RAHASIA = process.env.MY_SECRET_PIN;

    // 3. LOGIKA SATPAM: Cek apakah ini akses dari Termux/Python?
    // Jika User-Agent mengandung 'python-requests' atau ada Header Authorization, wajib cek PIN.
    if (userAgent.includes('python-requests') || authHeader) {
      if (authHeader !== `Bearer ${PIN_RAHASIA}`) {
        return NextResponse.json(
          { success: false, error: 'Akses Ditolak: PIN Salah atau Tidak Ada' }, 
          { status: 401 }
        );
      }
    }

    // 4. Validasi input URL
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL harus diisi' }, { status: 400 });
    }

    // 5. Proses pembuatan Short ID
    const shortId = generateRandomId(6);

    // 6. Simpan ke Supabase
    const { data, error } = await supabase
      .from('links')
      .insert([{ id: shortId, url: url }])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    // 7. Respon Sukses
    return NextResponse.json({ 
      success: true, 
      shortId, 
      url,
      message: 'Link berhasil dibuat!' 
    });

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}
