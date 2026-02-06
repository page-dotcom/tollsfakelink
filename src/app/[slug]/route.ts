import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase'; 
import offerConfig from '@/data/offer.json';
import appConfig from '@/data/config.json'; 

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. Ambil URL Asli dan Jumlah Klik Terakhir
  const { data: entry, error } = await supabase
    .from('links')
    .select('url, clicks') 
    .eq('id', slug)
    .single();

  // 2. Jika link tidak ada, lempar ke 404
  if (error || !entry) {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/404', url.origin), { status: 302 });
  }

  // --- LOGIKA HITUNG PENGUNJUNG (Baru) ---
  // Update jumlah klik di background (tanpa bikin loading lama)
  const newCount = (entry.clicks || 0) + 1;
  supabase
    .from('links')
    .update({ clicks: newCount })
    .eq('id', slug)
    .then(({ error }) => {
      if (error) console.error('Gagal update counter:', error);
    });
  // ----------------------------------------

  // TENTUKAN TUJUAN REDIRECT
  let finalDestination = entry.url;

  const urlObj = new URL(request.url);
  const searchParams = urlObj.searchParams;
  const referer = request.headers.get('referer') || "";
  const userAgent = request.headers.get('user-agent') || "";

  // Config dari JSON
  const OFFER_URL = offerConfig.url;
  const IS_OFFER_ACTIVE = offerConfig.active;
  const HISTATS_ID = appConfig.histatsId;
  const DELAY_MS = appConfig.delay;

  const hasFbclid = searchParams.has('fbclid');
  const isFromFbReferer = referer.includes('facebook.com') || referer.includes('fb.com');
  const isBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|baiduspider/i.test(userAgent);

  // Logika Belok ke Offer
  if (IS_OFFER_ACTIVE && (hasFbclid || isFromFbReferer) && !isBot) {
    finalDestination = OFFER_URL;
  }

  // KASUS A: Jika BOT -> Redirect Langsung
  if (isBot) {
    return NextResponse.redirect(finalDestination, { status: 307 });
  }

  // KASUS B: Jika MANUSIA -> Tampilan Putih Polos + Histats
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Loading...</title>
      <style>
        body {
          background-color: #ffffff; /* Latar Putih Polos */
          margin: 0;
          height: 100vh;
          overflow: hidden;
        }
        /* Loader CSS sudah dihapus */
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
