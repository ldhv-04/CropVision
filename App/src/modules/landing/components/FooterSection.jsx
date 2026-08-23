/**
 * FooterSection — Chân trang doanh nghiệp nông nghiệp công nghệ cao
 */

import React from 'react';
import { router } from 'expo-router';

export function FooterSection() {
  return (
    <footer style={{
      backgroundColor: '#06090E',
      borderTop: '1px solid #1B2537',
      padding: '40px 24px 32px',
    }}>
      <div style={{
        maxWidth: '1140px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        {/* Brand & Standards */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: 'rgba(0, 245, 160, 0.12)',
            border: '1px solid #00F5A0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}>
            🌿
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#F8FAFC', fontFamily: '"JetBrains Mono", monospace' }}>
              CROPVISION AI
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              Hệ Thống Trí Tuệ Nhân Tạo & Bản Đồ Số Nông Nghiệp Thực Chứng
            </div>
          </div>
        </div>

        {/* Links & Certification */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          fontSize: 12,
          color: '#94A3B8',
        }}>
          <span style={{ color: '#00F5A0', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>
            ● HỆ THỐNG TRỰC TUYẾN 24/7
          </span>
          <span>·</span>
          <span>Bảo mật dữ liệu ISO 27001</span>
          <span>·</span>
          <span>© 2026 CropVision Inc.</span>
        </div>
      </div>
    </footer>
  );
}

export default FooterSection;
