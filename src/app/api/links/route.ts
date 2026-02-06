import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

// Cek PIN Keamanan (Wajib!)
const cekAuth = (req: Request) => {
  const authHeader = req.headers.get('authorization');
  const PIN = process.env.MY_SECRET_PIN;
  return authHeader === `Bearer ${PIN}`;
};

// 1. GET: Ambil Daftar Link (Untuk Menu List di Termux)
export async function GET(req: Request) {
  if (!cekAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false }); // Urutkan dari yang terbaru

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// 2. DELETE: Hapus Link
export async function DELETE(req: Request) {
  if (!cekAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  const { error } = await supabase.from('links').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// 3. PATCH: Edit Link
export async function PATCH(req: Request) {
  if (!cekAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, newUrl } = await req.json();
  const { error } = await supabase
    .from('links')
    .update({ url: newUrl })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
