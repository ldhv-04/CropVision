/**
 * LandingTopNav — Header điều hướng tinh gọn, chuẩn mực & uy tín
 */

import React from 'react';
import { router } from 'expo-router';

export function LandingTopNav() {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      backgroundColor: 'rgba(6, 9, 14, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      zIndex: 1000,
    }}>
      {/* Brand Identity */}
      <div 
        onClick={() => router.push('/welcome')}
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          backgroundColor: 'rgba(0, 245, 160, 0.12)',
          border: '1px solid #00F5A0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          boxShadow: '0 0 14px rgba(0, 245, 160, 0.3)',
        }}>
          🌿
        </div>
        <div>
          <div style={{
            fontSize: 17,
            fontWeight: 900,
            color: '#F8FAFC',
            letterSpacing: '0.5px',
            fontFamily: '"JetBrains Mono", "SF Mono", monospace',
            lineHeight: 1.1,
          }}>
            CROPVISION
          </div>
          <div style={{
            fontSize: 9.5,
            color: '#00F5A0',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            AI NÔNG NGHIỆP THỰC CHỨNG
          </div>
        </div>
      </div>

      {/* Trust Badge & Hotline */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: 12,
          color: '#94A3B8',
        }} className="desktop-pill">
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00F5A0', boxShadow: '0 0 8px #00F5A0' }} />
          <span>Chuẩn nhận diện 58+ bệnh cây trồng nhiệt đới</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/login')}
            data-testid="btn-nav-login"
            style={{
              padding: '9px 20px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#F8FAFC',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = '#00F5A0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            Đăng nhập
          </button>

          <button
            onClick={() => router.push('/register')}
            data-testid="btn-nav-register"
            style={{
              padding: '9px 22px',
              borderRadius: 6,
              border: '1px solid #00F5A0',
              backgroundColor: '#00F5A0',
              color: '#06090E',
              fontSize: 13,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(0, 245, 160, 0.35)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 245, 160, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 245, 160, 0.35)';
            }}
          >
            Dùng thử miễn phí
          </button>
        </div>
      </div>
    </header>
  );
}

export default LandingTopNav;
