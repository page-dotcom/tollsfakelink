import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

// 1. GET: Ambil Daftar Link
export async function GET(req: Request) {
  // Langsung ambil data (Gak usah cek PIN, RLS database yang ngatur)
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// 2. DELETE: Hapus Link
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const { error } = await supabase.from('links').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. PATCH: Edit Link
export async function PATCH(req: Request) {
  try {
    const { id, newUrl } = await req.json();
    const { error } = await supabase
      .from('links')
      .update({ url: newUrl })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
