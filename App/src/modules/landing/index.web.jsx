/**
 * index.web.jsx (Premium Landing Layout for Web/Desktop)
 * 
 * Lắp ráp các module Premium. Định nghĩa toàn bộ Global Keyframes phức tạp
 * như marquee, floating, pulse cho toàn trang.
 */

import React from 'react';
import { useTheme } from '../@core/context/ThemeContext';
import { HeroSection } from './components/HeroSection';
import { BentoFeatures } from './components/BentoFeatures';
import { ProcessMarquee } from './components/ProcessMarquee';
import { FooterSection } from './components/FooterSection';

export function LandingLayout() {
  const { colors } = useTheme();

  return (
    <div style={{
      /* Ép dùng màu tối làm chuẩn để làm nổi bật glow xanh lá (Neon) */
      backgroundColor: '#050505', 
      color: '#ffffff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Background Noise Texture tạo chiều sâu cinematic */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.03%22/%3E%3C/svg%3E")',
        pointerEvents: 'none', zIndex: 9999
      }} />

      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${colors.primary}; }

        /* Animation xuất hiện dần */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }

        /* Animation bồng bềnh 3D */
        @keyframes float {
          0% { transform: translateY(0px) rotateX(5deg) scale(0.98); }
          50% { transform: translateY(-15px) rotateX(8deg) scale(1.02); }
          100% { transform: translateY(0px) rotateX(5deg) scale(0.98); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        /* Vòng phát sáng chóp (Pulse Glow) */
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        /* Animation Băng chuyền vô tận */
        @keyframes scrollMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: 200%;
          animation: scrollMarquee 25s linear infinite;
        }

        /* Gradient Text */
        .text-gradient {
          background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.5) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .text-gradient-primary {
          background: linear-gradient(135deg, ${colors.primary} 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <HeroSection />
      <BentoFeatures />
      <ProcessMarquee />
      <FooterSection />
    </div>
  );
}
