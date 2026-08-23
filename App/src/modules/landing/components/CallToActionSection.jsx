/**
 * CallToActionSection — Khối kích hoạt hành động cuối trang
 */

import React from 'react';
import { router } from 'expo-router';

export function CallToActionSection() {
  return (
    <section style={{
      padding: '90px 24px',
      backgroundColor: '#0D1320',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow Center */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '300px',
        background: 'radial-gradient(ellipse at center, rgba(0, 245, 160, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px', margin: '0 auto' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 800,
          color: '#00F5A0',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '1.2px',
          marginBottom: '12px',
        }}>
          BẢO VỆ MÙA VỤ NGAY HÔM NAY
        </div>

        <h2 style={{
          fontSize: 'clamp(28px, 4.5vw, 44px)',
          fontWeight: 900,
          color: '#F8FAFC',
          lineHeight: 1.2,
          margin: '0 0 20px 0',
        }}>
          Sẵn Sàng Làm Chủ Công Nghệ Nông Nghiệp Thực Chứng?
        </h2>

        <p style={{
          fontSize: '16px',
          color: '#94A3B8',
          lineHeight: 1.6,
          margin: '0 auto 36px auto',
          maxWidth: '620px',
        }}>
          Đăng ký tài khoản miễn phí để bắt đầu quét mẫu lá đầu tiên hoặc kết nối với hệ thống Trạm Điều Hành Station.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/register')}
            data-testid="cta-bottom-register"
            style={{
              padding: '16px 36px',
              fontSize: '15px',
              fontWeight: 900,
              backgroundColor: '#00F5A0',
              color: '#06090E',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(0, 245, 160, 0.4)',
              transition: 'all 0.15s ease',
              fontFamily: 'system-ui, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 245, 160, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 245, 160, 0.4)';
            }}
          >
            ⚡ Tạo Tài Khoản Nông Hộ Miễn Phí
          </button>

          <button
            onClick={() => router.push('/login')}
            data-testid="cta-bottom-login"
            style={{
              padding: '16px 28px',
              fontSize: '15px',
              fontWeight: 700,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: '#F8FAFC',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = '#00F5A0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            Đăng Nhập Quản Trị Viên
          </button>
        </div>
      </div>
    </section>
  );
}

export default CallToActionSection;
