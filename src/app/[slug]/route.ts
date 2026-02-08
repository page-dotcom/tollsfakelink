import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { userAgent } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. AMBIL DATA DARI DATABASE (Parallel)
  const [linkResult, settingsResult] = await Promise.all([
    supabase.from('links').select('url, clicks').eq('id', slug).single(),
    supabase.from('settings').select('*').eq('id', 1).single()
  ]);

  const entry = linkResult.data;
  const settings = settingsResult.data;

  // 2. Jika link tidak ada, lempar ke 404
  if (linkResult.error || !entry) {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/404', url.origin), { status: 302 });
  }

  // --- LOGIKA HITUNG PENGUNJUNG ---
  // Kita update di background tanpa await biar ngebut
  supabase.from('links').update({ clicks: (entry.clicks || 0) + 1 }).eq('id', slug).then();

  // --- DETEKSI PENGUNJUNG ---
  const ua = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  const urlObj = new URL(request.url);
  
  // Deteksi Bot Lebih Akurat (Termasuk Facebook Crawler)
  const isBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|baiduspider/i.test(ua);
  
  // Deteksi Traffic dari Facebook (fbclid atau referer)
  const isFacebook = urlObj.searchParams.has('fbclid') || referer.includes('facebook') || referer.includes('fb.com');

  // --- LOGIKA UTAMA REDIRECT ---
  
  // Default tujuan adalah URL ASLI
  let finalDestination = entry.url; 
  
  // Ambil settingan
  const OFFER_URL = settings?.offer_url;
  const IS_OFFER_ACTIVE = settings?.offer_active;
  const SITE_NAME = settings?.site_name || "Loading...";
  const HISTATS_ID = settings?.histats_id;
  const DELAY_MS = settings?.delay_ms || 2000;

  // JIKA MANUSIA (Bukan Bot) DAN OFFER AKTIF
  if (!isBot && IS_OFFER_ACTIVE && OFFER_URL) {
    // Opsi A: Khusus trafik dari Facebook saja
    if (isFacebook) {
       finalDestination = OFFER_URL;
    }
    // Opsi B: (Kalau mau SEMUA trafik dilempar ke offer, hapus "if (isFacebook)" di atas)
  }

  // KASUS 1: JIKA BOT -> LANGSUNG KE URL ASLI (Biar Preview Muncul)
  if (isBot) {
    return NextResponse.redirect(entry.url, { status: 307 }); // Selalu ke konten asli buat bot
  }

  // KASUS 2: MANUSIA -> TAMPILKAN HALAMAN LOADING (Putih Polos + Histats)
  // Di sini finalDestination sudah berubah jadi Offer URL kalau kondisinya pas.
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${SITE_NAME}</title>
      <style>
        body { background-color: #ffffff; margin: 0; height: 100vh; overflow: hidden; }
      </style>
    </head>
    <body>
      <script type="text/javascript">
        var _Hasync= _Hasync|| [];
        _Hasync.push(['Histats.start', '1,${HISTATS_ID},4,0,0,0,00010000']);
        _Hasync.push(['Histats.fasi', '1']);
        _Hasync.push(['Histats.track_hits', '']);
        (function() {
          var hs = document.createElement('script'); hs.type = 'text/javascript'; hs.async = true;
          hs.src = ('//s10.histats.com/js15_as.js');
          (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
        })();
      </script>
      <noscript>
        <a href="/" target="_blank"><img src="//sstatic1.histats.com/0.gif?${HISTATS_ID}&101" alt="" border="0"></a>
      </noscript>

      <script>
        setTimeout(function() {
          window.location.href = "${finalDestination}";
        }, ${DELAY_MS});
      </script>
    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: { 'Content-Type': 'text/html' },
  });
}
