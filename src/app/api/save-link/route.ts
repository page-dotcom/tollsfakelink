import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

// Fungsi sederhana untuk membuat string acak
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

    if (!url) {
      return NextResponse.json({ error: 'URL harus diisi' }, { status: 400 });
    }

    const shortId = generateRandomId(6); // Menghasilkan ID acak 6 karakter

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
