import React from 'react';

/**
 * PrescriptionPanel Component
 * Renders the agronomic dossier panel showing disease classification,
 * confidence meter, active ingredients, dosage, and economic impact.
 */
export function PrescriptionPanel({ selectedCase }) {
  return (
    <div style={{
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 16,
      backgroundColor: '#0D1320',
    }}>
      <div>
        {/* Kicker & Status Tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#00D2FF',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '1px',
          }}>
            KẾT QUẢ CHẨN ĐOÁN & PHÁC ĐỒ NÔNG HỌC
          </span>
          <span style={{
            fontSize: 9.5,
            fontWeight: 800,
            color: selectedCase.severityColor,
            backgroundColor: `${selectedCase.severityColor}15`,
            border: `1px solid ${selectedCase.severityColor}40`,
            padding: '2px 8px',
            borderRadius: 4,
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            {selectedCase.severity}
          </span>
        </div>

        {/* Disease Heading */}
        <h3 style={{
          fontSize: 22,
          fontWeight: 900,
          color: '#F8FAFC',
          margin: '0 0 4px 0',
        }}>
          {selectedCase.diseaseName}
        </h3>
        <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginBottom: 16 }}>
          Tác nhân: {selectedCase.scientificName}
        </div>

        {/* Confidence & Accuracy Meter */}
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: 'rgba(6, 9, 14, 0.6)',
          border: '1px solid #1B2537',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>Độ chính xác nhận diện AI:</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#00F5A0', fontFamily: '"JetBrains Mono", monospace' }}>
              {selectedCase.confidence}% KHẲNG ĐỊNH
            </span>
          </div>
          <div style={{ height: 6, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${selectedCase.confidence}%`, backgroundColor: '#00F5A0', boxShadow: '0 0 10px #00F5A0' }} />
          </div>
        </div>

        {/* Phác đồ xử lý thực tế */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: 6,
            backgroundColor: 'rgba(0, 245, 160, 0.04)',
            border: '1px solid rgba(0, 245, 160, 0.15)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#00F5A0', fontFamily: '"JetBrains Mono", monospace' }}>
              💊 HOẠT CHẤT & THUỐC BVTV KHUYẾN NGHỊ:
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>
              {selectedCase.prescription.activeIngredient}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{
              padding: '10px 12px',
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid #1B2537',
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', fontFamily: '"JetBrains Mono", monospace' }}>LIỀU LƯỢNG PHA:</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#00D2FF', marginTop: 2 }}>{selectedCase.prescription.dosage}</div>
            </div>
            <div style={{
              padding: '10px 12px',
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid #1B2537',
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', fontFamily: '"JetBrains Mono", monospace' }}>LƯỢNG NƯỚC PHUN:</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#00D2FF', marginTop: 2 }}>{selectedCase.prescription.waterRate}</div>
            </div>
          </div>

          <div style={{
            fontSize: 11.5,
            color: '#94A3B8',
            lineHeight: 1.4,
            padding: '8px 12px',
            borderLeft: '3px solid #FFB300',
            backgroundColor: 'rgba(255, 179, 0, 0.04)',
          }}>
            <strong style={{ color: '#FFB300' }}>Thời điểm vàng: </strong>
            {selectedCase.prescription.sprayTiming}
          </div>
        </div>
      </div>

      {/* Bottom Economic Impact */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: 6,
        backgroundColor: 'rgba(0, 245, 160, 0.08)',
        border: '1px solid rgba(0, 245, 160, 0.25)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC' }}>
          🛡️ {selectedCase.prescription.economicBenefit}
        </span>
      </div>
    </div>
  );
}
