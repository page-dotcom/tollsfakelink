'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="nf-container">
      <style jsx global>{`
        /* RESET KHUSUS HALAMAN INI */
        body { margin: 0; padding: 0; background: #fff; }

        .nf-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          text-align: center;
          padding: 20px;
          overflow: hidden;
        }

        /* SVG ANIMATION */
        .svg-404 {
          width: 350px;
          max-width: 100%;
          height: auto;
          margin-bottom: 20px;
        }

        /* ANIMASI MENGAMBANG (Floating) */
        .anim-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        /* ANIMASI BAYANGAN (Shadow) */
        .anim-shadow {
          animation: shadowScale 3s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes shadowScale {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(0.8); opacity: 0.1; }
        }

        /* ANIMASI KEDIP (Blink) */
        .anim-blink {
          animation: blink 4s infinite;
          transform-origin: center;
        }
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }

        /* TEXT STYLES */
        .nf-title {
          font-size: 80px;
          font-weight: 800;
          color: #337ab7; /* Bootstrap Primary Blue */
          margin: 0;
          line-height: 1;
          letter-spacing: -2px;
        }

        .nf-subtitle {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin-top: 10px;
          margin-bottom: 10px;
        }

        .nf-text {
          color: #777;
          font-size: 16px;
          max-width: 450px;
          margin: 0 auto 30px auto;
          line-height: 1.5;
        }

        /* BUTTON STYLE (BOOTSTRAP 3 LOOK) */
        .nf-btn {
          display: inline-block;
          padding: 12px 35px;
          background-color: #337ab7;
          color: white;
          border-radius: 4px; /* Kotak Rapi */
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          border: 1px solid #2e6da4;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .nf-btn:hover {
          background-color: #286090;
          border-color: #204d74;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
      `}</style>

      {/* GAMBAR ROBOT SVG ANIMASI */}
      <svg className="svg-404" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        {/* Bayangan di lantai */}
        <ellipse cx="200" cy="280" rx="70" ry="10" fill="#333" className="anim-shadow" />
        
        {/* Grup Badan Robot (Floating) */}
        <g className="anim-float">
          
          {/* Antena */}
          <line x1="200" y1="80" x2="200" y2="40" stroke="#337ab7" strokeWidth="4" />
          <circle cx="200" cy="40" r="6" fill="#d9534f" />

          {/* Telinga */}
          <rect x="130" y="110" width="10" height="30" rx="2" fill="#555" />
          <rect x="260" y="110" width="10" height="30" rx="2" fill="#555" />

          {/* Kepala */}
          <rect x="140" y="80" width="120" height="100" rx="15" fill="#f0f0f0" stroke="#337ab7" strokeWidth="4" />
          
          {/* Layar Wajah */}
          <rect x="155" y="100" width="90" height="60" rx="8" fill="#333" />
          
          {/* Mata (Animasi Kedip) */}
          <g className="anim-blink">
            <circle cx="175" cy="130" r="8" fill="#5cb85c" /> {/* Mata Hijau */}
            <circle cx="225" cy="130" r="8" fill="#5cb85c" />
          </g>
          
          {/* Mulut */}
          <path d="M 185 145 Q 200 155 215 145" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Leher */}
          <rect x="185" y="180" width="30" height="10" fill="#555" />

          {/* Badan */}
          <path d="M 150 190 L 160 240 Q 160 250 170 250 L 230 250 Q 240 250 240 240 L 250 190 Z" fill="#337ab7" />
          
          {/* Logo di Dada */}
          <circle cx="200" cy="220" r="12" fill="#fff" opacity="0.3" />

          {/* Tangan Kiri */}
          <path d="M 150 200 Q 120 220 130 240" stroke="#337ab7" strokeWidth="10" fill="none" strokeLinecap="round" />
          
          {/* Tangan Kanan */}
          <path d="M 250 200 Q 280 220 270 240" stroke="#337ab7" strokeWidth="10" fill="none" strokeLinecap="round" />
        </g>
      </svg>

      {/* TEKS */}
      <h1 className="nf-title">404</h1>
      <h2 className="nf-subtitle">Oops! Page Not Found</h2>
      <p className="nf-text">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      
      {/* TOMBOL */}
      <Link href="/" className="nf-btn">
        GO BACK HOME
      </Link>
    </div>
  );
}
