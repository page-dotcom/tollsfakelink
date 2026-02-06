import type { Metadata, Viewport } from "next";

// 1. SETTING VIEWPORT (Warna Status Bar HP)
export const viewport: Viewport = {
  themeColor: "#050505", // Hitam pekat (sesuai tema)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 2. SETTING META TAG LENGKAP + ICON + GAMBAR
export const metadata: Metadata = {
  // Ganti URL ini dengan domain asli Vercel kamu nanti
  metadataBase: new URL('https://www.sekphim-tv.eu.org'), 

  title: {
    default: "SecureLink - Private URL Shortener",
    template: "%s | SecureLink"
  },
  description: "Official private link management system. Secure, fast, and reliable redirection service.",
  
  // -- ICON DI TAB BROWSER --
  icons: {
    icon: '/icon.png',        // Pastikan ada file icon.png di folder public
    shortcut: '/icon.png',
    apple: '/icon.png',       // Icon untuk pengguna iPhone/Mac
  },

  // -- OPEN GRAPH (Facebook, WhatsApp, LinkedIn) --
  openGraph: {
    title: "SecureLink - Access Restricted",
    description: "This is a private secure link node. Official management system.",
    url: '/',
    siteName: "SecureLink System",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: '/og-image.jpg', // Pastikan ada file og-image.jpg di folder public
        width: 1200,
        height: 630,
        alt: "SecureLink System Preview",
      },
    ],
  },

  // -- TWITTER / X --
  twitter: {
    card: "summary_large_image",
    title: "SecureLink System",
    description: "Private URL Shortener Service.",
    images: ['/og-image.jpg'], // Mengambil gambar yang sama
  },

  // -- ROBOTS (Agar Halaman Utama di-Index Google) --
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Style Global Sederhana untuk memastikan background hitam */}
      <body style={{ margin: 0, padding: 0, backgroundColor: '#050505', color: 'white' }}>
        {children}
      </body>
    </html>
  );
}
