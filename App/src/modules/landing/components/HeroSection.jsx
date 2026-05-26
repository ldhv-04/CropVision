/**
 * HeroSection.jsx
 * 
 * Màn hình dạo đầu chuẩn SaaS hiện đại:
 * - Chữ khổng lồ (Giant Typography).
 * - Floating Dashboard Mockup (Hiệu ứng Dashboard bay lơ lửng 3D).
 * - Glow background rực rỡ.
 */

import { router } from 'expo-router';
import { useTheme } from '../../@core/context/ThemeContext';

export function HeroSection() {
  const { colors } = useTheme();

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: '12vh',
      paddingBottom: '10vh',
      textAlign: 'center',
    }}>
      {/* Mesh Glow Background */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '800px', height: '400px',
        background: `radial-gradient(ellipse, ${colors.primary}30 0%, transparent 70%)`,
        filter: 'blur(80px)', zIndex: 0,
        animation: 'pulseGlow 8s infinite alternate'
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 20px', maxWidth: '900px' }}>
        {/* Pill Badge */}
        <div className="animate-fade-in-up" style={{
          display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: '999px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', fontSize: '13px', fontWeight: '500', marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.primary, marginRight: '8px', boxShadow: `0 0 10px ${colors.primary}` }} />
          CropVision v2.0 - Kỷ nguyên mới của Nông nghiệp
        </div>

        {/* Giant Typography */}
        <h1 className="animate-fade-in-up delay-1" style={{
          fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: '800', lineHeight: '1.1',
          letterSpacing: '-0.03em', margin: '0 0 24px 0',
        }}>
          <span className="text-gradient">Tương lai của</span> <br />
          <span className="text-gradient-primary">Nông Nghiệp Thông Minh.</span>
        </h1>

        <p className="animate-fade-in-up delay-2" style={{
          fontSize: '20px', color: '#a1a1aa', lineHeight: '1.6',
          margin: '0 auto 48px auto', maxWidth: '640px', fontWeight: '400'
        }}>
          Đưa sức mạnh của trí tuệ nhân tạo (YOLO) và vạn vật kết nối (IoT) vào từng luống cây. Phân tích, cảnh báo và tự động hóa trong nháy mắt.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up delay-3" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button 
            data-testid="cta-start"
            onClick={() => router.push('/login')}
            style={{
              padding: '16px 36px', fontSize: '16px', fontWeight: '600',
              backgroundColor: '#fff', color: '#000',
              border: 'none', borderRadius: '12px', cursor: 'pointer',
              boxShadow: `0 0 40px rgba(255,255,255,0.2)`,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Bắt đầu miễn phí
          </button>
        </div>
      </div>

      {/* Floating Dashboard Mockup */}
      <div className="animate-fade-in-up animate-float delay-3" style={{
        marginTop: '80px', position: 'relative', zIndex: 2,
        width: '90%', maxWidth: '1000px', height: '500px',
        background: 'rgba(20, 20, 20, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* macOS like window controls */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#eab308' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
        </div>
        {/* Abstract UI lines inside mockup to look like a dashboard */}
        <div style={{ padding: '24px', display: 'flex', gap: '24px', flex: 1 }}>
          <div style={{ width: '200px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '24px', height: '120px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }} />
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }} />
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }} />
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', background: `linear-gradient(0deg, ${colors.primary}20, transparent)` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
