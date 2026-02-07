import './globals.css';
import type { Metadata, Viewport } from "next";
import { supabase } from '@/data/supabase';

// 1. SETTING VIEWPORT (Warna Status Bar HP)
export const viewport: Viewport = {
  themeColor: "#050505", // Hitam pekat
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 2. GENERATE METADATA (DINAMIS DARI DATABASE)
// Ini pengganti 'export const metadata' biar bisa ambil data dulu
export async function generateMetadata(): Promise<Metadata> {
  
  // Ambil Nama Situs dari Database
  const { data } = await supabase.from('settings').select('site_name').single();
  
  // Kalau database belum siap/error, pakai nama default ini
  const siteName = data?.site_name || "SecureLink System";
  
  const baseUrl = 'https://www.sekphim-tv.eu.org';

  return {
    metadataBase: new URL(baseUrl),

    title: {
      default: siteName,
      template: `%s | ${siteName}` // Nanti jadinya: "Halaman X | NamaSitus"
    },
    description: `Official private link management system by ${siteName}. Secure and reliable.`,

    // -- ICON --
    icons: {
      icon: '/icon.png',
      shortcut: '/icon.png',
      apple: '/icon.png',
    },

    // -- OPEN GRAPH (WA, FB, IG) --
    openGraph: {
      title: `${siteName} - Access Restricted`,
      description: "This is a private secure link node. Official management system.",
      url: '/',
      siteName: siteName, // Nama situs di preview WA
      locale: "en_US",
      type: "website",
      images: [
        {
          url: 'https://i.ibb.co.com/bj8MRG2B/blog2-F63f7bfe24890332fa0e7bc492-Fimgac144d-e0eb-bdf4-4810-38bbad0b28d.png',
          width: 1200,
          height: 630,
          alt: `${siteName} Preview`,
        },
      ],
    },

    // -- TWITTER / X --
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: "Private URL Shortener Service.",
      images: ['https://i.ibb.co.com/bj8MRG2B/blog2-F63f7bfe24890332fa0e7bc492-Fimgac144d-e0eb-bdf4-4810-38bbad0b28d.png'],
    },

    // -- ROBOTS --
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
}

// 3. ROOT LAYOUT (TAMPILAN DASAR)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* BOOTSTRAP 3 & FONT POPPINS (JANGAN DIHAPUS) */}
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
