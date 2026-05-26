/**
 * FooterSection.jsx
 * 
 * Thiết kế chân trang tối giản (Minimalist), sang trọng.
 * Có một dải gradient mờ tạo cảm giác Glow bên dưới nút bấm.
 */

import { router } from 'expo-router';
import { useTheme } from '../../@core/context/ThemeContext';

export function FooterSection() {
  const { colors } = useTheme();

  return (
    <footer style={{ position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute', bottom: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '300px',
        background: `radial-gradient(ellipse, ${colors.primary}20 0%, transparent 70%)`,
        filter: 'blur(60px)', zIndex: 0,
      }} />

      {/* Cụm CTA Giữa Màn Hình */}
      <div style={{ padding: '120px 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '24px', letterSpacing: '-1px' }}>
          Bạn đã sẵn sàng?
        </h2>
        <p style={{ fontSize: '18px', color: '#a1a1aa', marginBottom: '40px' }}>
          Gia nhập nền tảng quản lý nông nghiệp thông minh bậc nhất hiện nay.
        </p>
        <button 
          onClick={() => router.push('/register')}
          style={{
            padding: '16px 40px', fontSize: '18px', fontWeight: '600',
            backgroundColor: '#fff', color: '#000',
            border: 'none', borderRadius: '12px', cursor: 'pointer',
            boxShadow: `0 0 30px rgba(255,255,255,0.15)`,
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Tham gia ngay
        </button>
      </div>

      {/* Thông tin Bản quyền */}
      <div style={{ 
        maxWidth: '1200px', margin: '0 auto', padding: '32px 20px', 
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 1 
      }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>
          CropVision <span style={{ color: colors.primary }}>.</span>
        </div>
        <div style={{ color: '#52525b', fontSize: '14px' }}>
          © 2026 CropVision AI. Đã đăng ký bản quyền.
        </div>
      </div>
    </footer>
  );
}
