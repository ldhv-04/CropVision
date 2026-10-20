/**
 * DiagnosticSimulator — Bộ mô phỏng quét chẩn đoán bệnh quang học trực tiếp
 *
 * Cho phép người xem bấm chọn các trường hợp cây trồng thực tế
 * để chứng thực khả năng nhận diện và kê đơn của CropVision AI.
 */

import React, { useState } from 'react';
import { CROP_CASES } from '../constants/diagnosticCases';
import { LeafViewport } from './LeafViewport';
import { PrescriptionPanel } from './PrescriptionPanel';

export function DiagnosticSimulator() {
  const [selectedCase, setSelectedCase] = useState(CROP_CASES[0]);

  return (
    <div style={{
      width: '100%',
      maxWidth: '1140px',
      margin: '0 auto',
      borderRadius: '16px',
      backgroundColor: '#0D1320',
      border: '1px solid #1B2537',
      boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 1px rgba(0, 245, 160, 0.3)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Simulator Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        backgroundColor: '#06090E',
        borderBottom: '1px solid #1B2537',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: '#00F5A0',
            boxShadow: '0 0 8px #00F5A0',
            display: 'inline-block',
          }} />
          <span style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#F8FAFC',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.8px',
          }}>
            TRÌNH MÔ PHỎNG CHẨN ĐOÁN AI QUANG HỌC
          </span>
          <span style={{
            fontSize: 9.5,
            color: '#00D2FF',
            backgroundColor: 'rgba(0, 210, 255, 0.12)',
            padding: '2px 7px',
            borderRadius: 4,
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 700,
          }}>
            YOLOv8-AGRO ENGINE
          </span>
        </div>

        {/* Case Switcher Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CROP_CASES.map((item) => {
            const isActive = selectedCase.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedCase(item)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: `1px solid ${isActive ? '#00F5A0' : '#1B2537'}`,
                  backgroundColor: isActive ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? '#00F5A0' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                🌾 Mẫu: {item.crop}
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulator Main Body Split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(360px, 1.4fr)',
        minHeight: '440px',
      }} className="simulator-grid">
        <LeafViewport selectedCase={selectedCase} />
        <PrescriptionPanel selectedCase={selectedCase} />
      </div>
    </div>
  );
}

export default DiagnosticSimulator;
