/**
 * BentoFeatures.jsx
 * 
 * Lưới Bento không đối xứng với hiệu ứng Spotlight Hover chuẩn SaaS.
 * Sử dụng React useRef và onMouseMove để tính toán tọa độ chuột 
 * truyền vào CSS Custom Properties (--x, --y).
 */

import React, { useRef } from 'react';
import { useTheme } from '../../@core/context/ThemeContext';

// Thành phần Thẻ (Card) xử lý Spotlight
function SpotlightCard({ children, style, className }) {
  const divRef = useRef(null);
  const { colors } = useTheme();

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={className}
      style={{
        position: 'relative',
        backgroundColor: '#0a0a0a',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Lớp nền Glow khi Hover */}
      <div 
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(16,185,129,0.08), transparent 40%)`,
          zIndex: 0, pointerEvents: 'none', transition: 'opacity 0.3s'
        }} 
      />
      
      {/* Nội dung thực sự */}
      <div style={{ position: 'relative', zIndex: 1, padding: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

export function BentoFeatures() {
  const { colors } = useTheme();

  return (
    <section style={{ padding: '120px 20px', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', marginBottom: '24px' }}>
            Sinh ra để <span className="text-gradient-primary">Tối ưu hóa</span>
          </h2>
          <p style={{ fontSize: '18px', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto' }}>
            Kết hợp sức mạnh phân tích của trí tuệ nhân tạo và mạng lưới cảm biến IoT để cung cấp cái nhìn toàn cảnh chưa từng có.
          </p>
        </div>

        {/* Lưới Bento Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoRows: 'minmax(250px, auto)',
          gap: '24px',
        }}>
          
          {/* Card 1: To nhất (Span 2 cột, 2 hàng) */}
          <SpotlightCard style={{ gridColumn: 'span 2', gridRow: 'span 2' }}>
            <h3 style={{ fontSize: '28px', color: '#fff', fontWeight: '700', marginBottom: '16px' }}>Thị giác Máy tính xuất chúng</h3>
            <p style={{ color: '#a1a1aa', fontSize: '16px', lineHeight: '1.6', maxWidth: '400px' }}>
              Mô hình YOLOv8 được huấn luyện trên hàng triệu hình ảnh bệnh lý, nhận diện sâu bệnh ngay khi lá non vừa nhú.
            </p>
            {/* Giả lập Graphic */}
            <div style={{ flex: 1, marginTop: '32px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '40px' }}>👁️</span>
            </div>
          </SpotlightCard>

          {/* Card 2: Nhỏ góc trên phải */}
          <SpotlightCard>
            <div style={{ fontSize: '32px', marginBottom: '16px', color: colors.primary }}>📡</div>
            <h3 style={{ fontSize: '22px', color: '#fff', fontWeight: '700', marginBottom: '12px' }}>Cảm biến thời gian thực</h3>
            <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: '1.6' }}>
              Kết nối hàng nghìn node IoT tại vườn, báo cáo độ ẩm, nhiệt độ mỗi 5 giây.
            </p>
          </SpotlightCard>

          {/* Card 3: Nhỏ góc dưới phải */}
          <SpotlightCard>
            <div style={{ fontSize: '32px', marginBottom: '16px', color: colors.primary }}>⚡</div>
            <h3 style={{ fontSize: '22px', color: '#fff', fontWeight: '700', marginBottom: '12px' }}>Phác đồ tự động</h3>
            <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: '1.6' }}>
              Nhận thông báo ngay lập tức kèm theo phương pháp trị liệu chuẩn xác.
            </p>
          </SpotlightCard>

        </div>
      </div>
    </section>
  );
}
