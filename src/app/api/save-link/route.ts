import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

// Fungsi Acak ID
function generateRandomId(length = 5) {
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
    
    // Validasi URL
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL wajib diisi' }, { status: 400 });
    }

    // Buat Short ID
    const shortId = generateRandomId(5);

    // Simpan ke Supabase (Tanpa Cek PIN)
    // RLS di database akan mengizinkan karena kita sudah setting Policy
    const { data, error } = await supabase
      .from('links')
      .insert([{ id: shortId, url: url, clicks: 0 }]) // Default clicks 0
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

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
