/**
 * HeroCredibility — Hero Section đậm chất chuyên nghiệp, uy tín & thực chứng nông học
 */

import React from 'react';
import { router } from 'expo-router';
import { DiagnosticSimulator } from './DiagnosticSimulator';

export function HeroCredibility() {
  return (
    <section style={{
      position: 'relative',
      paddingTop: '120px',
      paddingBottom: '80px',
      paddingLeft: '24px',
      paddingRight: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      overflow: 'hidden',
    }}>
      {/* Subtle Glow Backdrop */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '900px',
        height: '450px',
        background: 'radial-gradient(ellipse at center, rgba(0, 245, 160, 0.12) 0%, rgba(0, 210, 255, 0.05) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto' }}>
        {/* Top Trust Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 20,
          backgroundColor: 'rgba(0, 245, 160, 0.08)',
          border: '1px solid rgba(0, 245, 160, 0.3)',
          marginBottom: '24px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00F5A0', boxShadow: '0 0 8px #00F5A0' }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#00F5A0', fontFamily: '"JetBrains Mono", monospace' }}>
            CHUẨN HÓA NÔNG HỌC VIỆT NAM // BẢN QUYỀN AI 2026
          </span>
        </div>

        {/* Powerful Realistic Headline */}
        <h1 style={{
          fontSize: 'clamp(32px, 5.5vw, 64px)',
          fontWeight: 900,
          color: '#F8FAFC',
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          margin: '0 0 20px 0',
        }}>
          Bắt Đúng Bệnh Cây Trong <span style={{ color: '#00F5A0', textShadow: '0 0 24px rgba(0, 245, 160, 0.4)' }}>0.3 Giây.</span> <br />
          Cắt Giảm 35% Chi Phí Phân Thuốc.
        </h1>

        {/* Subtitle with Practical Truth */}
        <p style={{
          fontSize: 'clamp(15px, 2vw, 19px)',
          color: '#94A3B8',
          lineHeight: 1.6,
          maxWidth: '780px',
          margin: '0 auto 36px auto',
          fontWeight: 400,
        }}>
          Không còn đoán mò dịch hại hay phun tràn lan lãng phí. CropVision đưa trí tuệ nhân tạo thị giác máy tính vào từng rẫy vườn: quét lá qua điện thoại, khoanh vùng ổ dịch trên bản đồ vệ tinh và chỉ định đúng loại thuốc với liều lượng chuẩn xác.
        </p>

        {/* Key Real Value Metrics */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(16px, 4vw, 48px)',
          flexWrap: 'wrap',
          marginBottom: '40px',
        }}>
          {[
            { num: '98.4%', label: 'Độ chính xác chẩn đoán', sub: 'Mô hình YOLOv8-Agro' },
            { num: '58+', label: 'Chủng bệnh nhiệt đới', sub: 'Lúa, Cà phê, Sầu riêng, Tiêu...' },
            { num: '35%', label: 'Tiết kiệm chi phí thuốc', sub: 'Nhờ khoanh vùng điểm nóng' },
            { num: '0.3s', label: 'Tốc độ phản hồi', sub: 'Dùng mượt cả khi mất mạng' },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: '130px' }}>
              <div style={{
                fontSize: 'clamp(24px, 3.5vw, 36px)',
                fontWeight: 900,
                color: '#00F5A0',
                fontFamily: '"JetBrains Mono", monospace',
                lineHeight: 1,
              }}>
                {item.num}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', marginTop: '6px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Primary CTAs */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '64px',
        }}>
          <button
            onClick={() => router.push('/register')}
            data-testid="cta-start"
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
              display: 'flex',
              alignItems: 'center',
              gap: 8,
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
            <span>⚡ Bắt Đầu Khảo Sát Nông Trường Ngay</span>
          </button>

          <button
            onClick={() => router.push('/login')}
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
              display: 'flex',
              alignItems: 'center',
              gap: 8,
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
            <span>🔐 Đăng Nhập Hệ Thống</span>
          </button>
        </div>
      </div>

      {/* Embedded Live Leaf Simulator Preview */}
      <div style={{ width: '100%', position: 'relative', zIndex: 2 }}>
        <DiagnosticSimulator />
      </div>
    </section>
  );
}

export default HeroCredibility;
