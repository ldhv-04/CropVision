/**
 * ProcessMarquee.jsx
 * 
 * Băng chuyền cuộn vô tận liên tục hiển thị các thông số / đối tác.
 * Hiệu ứng CSS chạy không cần thư viện bên ngoài.
 */

import React from 'react';
import { useTheme } from '../../@core/context/ThemeContext';

const MARQUEE_ITEMS = [
  "98.5% ĐỘ CHÍNH XÁC AI", "•",
  "10,000+ HECTA GIÁM SÁT", "•",
  "PHÂN TÍCH TRONG 2 GIÂY", "•",
  "BẢO VỆ MÙA MÀNG 24/7", "•",
  "TÍCH HỢP HÀNG NGHÌN SENSOR", "•",
];

export function ProcessMarquee() {
  const { colors } = useTheme();

  return (
    <section style={{ padding: '60px 0', overflow: 'hidden', backgroundColor: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Vùng chứa Marquee */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        
        {/* Gradient che 2 đầu (Fade out) */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '150px', background: 'linear-gradient(to right, #0a0a0a, transparent)', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '150px', background: 'linear-gradient(to left, #0a0a0a, transparent)', zIndex: 2 }} />

        {/* Nội dung lặp lại để tạo vòng lặp vô tận (Gấp đôi lên) */}
        <div className="marquee-track">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {MARQUEE_ITEMS.map((item, idx) => (
                <span 
                  key={idx} 
                  style={{
                    fontSize: item === "•" ? '16px' : '28px',
                    fontWeight: item === "•" ? '400' : '800',
                    color: item === "•" ? colors.primary : 'transparent',
                    WebkitTextStroke: item === "•" ? 'none' : '1px rgba(255,255,255,0.2)',
                    margin: '0 40px',
                    letterSpacing: '2px',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
