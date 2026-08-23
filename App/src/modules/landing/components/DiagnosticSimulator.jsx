/**
 * DiagnosticSimulator — Bộ mô phỏng quét chẩn đoán bệnh quang học trực tiếp
 *
 * Cho phép người xem bấm chọn các trường hợp cây trồng thực tế
 * để chứng thực khả năng nhận diện và kê đơn của CropVision AI.
 */

import React, { useState } from 'react';

const CROP_CASES = [
  {
    id: 'rice',
    crop: 'Lúa Nước',
    region: 'ĐBSCL & Bắc Bộ',
    diseaseName: 'Bệnh Đạo Ôn Lá (Cháy lá)',
    scientificName: 'Magnaporthe oryzae',
    confidence: 98.6,
    severity: 'GIAI ĐOẠN 1 (MỚI CHỚM)',
    severityColor: '#FFB300',
    leafBg: 'linear-gradient(135deg, #1B382B 0%, #0F2318 100%)',
    spotX: '48%',
    spotY: '42%',
    spotWidth: '110px',
    spotHeight: '65px',
    spots: [
      { top: '38%', left: '46%', w: '45px', h: '22px' },
      { top: '52%', left: '50%', w: '35px', h: '18px' },
    ],
    prescription: {
      activeIngredient: 'Tricyclazole 75% WP + Isoprothiolane',
      dosage: '25 - 30g / bình 25 lít nước',
      sprayTiming: 'Phun sáng sớm (6h - 8h) hoặc chiều mát khi ráo sương',
      waterRate: '400 - 500 lít/ha',
      economicBenefit: 'Ngăn chặn sụp mặt rầy & bảo vệ 100% diện tích đòng lúa',
    },
    symptomDesc: 'Vết bệnh ban đầu là chấm kim màu xám xanh, sau đó loét rộng thành hình mắt én màu nâu xám viền vàng.',
  },
  {
    id: 'coffee',
    crop: 'Cà Phê Robusta',
    region: 'Tây Nguyên (Lâm Đồng, Đắk Lắk)',
    diseaseName: 'Bệnh Rỉ Sắt Cà Phê',
    scientificName: 'Hemileia vastatrix',
    confidence: 97.8,
    severity: 'GIAI ĐOẠN 2 (LÂY LAN NHANH)',
    severityColor: '#FF2E54',
    leafBg: 'linear-gradient(135deg, #2D3A1E 0%, #17220C 100%)',
    spotX: '42%',
    spotY: '48%',
    spotWidth: '130px',
    spotHeight: '90px',
    spots: [
      { top: '44%', left: '40%', w: '50px', h: '35px' },
      { top: '56%', left: '48%', w: '40px', h: '30px' },
      { top: '35%', left: '52%', w: '28px', h: '22px' },
    ],
    prescription: {
      activeIngredient: 'Hexaconazole 50g/l hoặc Đồng Hydroxide',
      dosage: '40 - 50ml / phuy 200 lít nước',
      sprayTiming: 'Phun ướt đều 2 mặt lá, đặc biệt tập trung mặt dưới',
      waterRate: '600 - 800 lít/ha',
      economicBenefit: 'Tránh rụng lá hàng loạt, giữ vững năng suất quả niên vụ',
    },
    symptomDesc: 'Mặt dưới lá xuất hiện các đốm phấn bột màu vàng cam, mặt trên lá chuyển sang màu nâu sẫm và rụng sớm.',
  },
  {
    id: 'durian',
    crop: 'Sầu Riêng (Ri6 / MonThong)',
    region: 'Đông Nam Bộ & Tây Nguyên',
    diseaseName: 'Bệnh Thán Thư Cháy Lá',
    scientificName: 'Colletotrichum gloeosporioides',
    confidence: 99.1,
    severity: 'GIAI ĐOẠN 1 (CỤC BỘ)',
    severityColor: '#00F5A0',
    leafBg: 'linear-gradient(135deg, #263320 0%, #121A0F 100%)',
    spotX: '52%',
    spotY: '36%',
    spotWidth: '120px',
    spotHeight: '80px',
    spots: [
      { top: '30%', left: '50%', w: '60px', h: '40px' },
      { top: '46%', left: '54%', w: '42px', h: '28px' },
    ],
    prescription: {
      activeIngredient: 'Azoxystrobin 200g/l + Difenoconazole 125g/l',
      dosage: '150ml / phuy 200 lít nước',
      sprayTiming: 'Phun khi cơi đọt vừa lụa hoặc sau các cơn mưa lớn kéo dài',
      waterRate: '800 - 1000 lít/ha',
      economicBenefit: 'Bảo tồn bộ lá cơi đọt, đảm bảo đủ sức nuôi trái non',
    },
    symptomDesc: 'Vết cháy bắt đầu từ chóp và mép lá lan dần vào trong thành các vòng tròn đồng tâm màu nâu sẫm viền vàng.',
  },
];

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
        {/* Left: Interactive Leaf Viewport */}
        <div style={{
          position: 'relative',
          background: selectedCase.leafBg,
          borderRight: '1px solid #1B2537',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          minHeight: '360px',
        }}>
          {/* Grid Overlay lines */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'linear-gradient(rgba(0, 245, 160, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 160, 0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }} />

          {/* Scanning Beam Animation */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00F5A0, #00D2FF, transparent)',
            boxShadow: '0 0 12px #00F5A0',
            top: '20%',
            animation: 'scanBeam 4s ease-in-out infinite alternate',
            zIndex: 10,
          }} />

          {/* Leaf Graphic Silhouette */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            width: '240px',
            height: '320px',
            borderRadius: '50% 0 50% 0 / 60% 0 60% 0',
            backgroundColor: 'rgba(34, 75, 48, 0.65)',
            border: '2px solid rgba(0, 245, 160, 0.25)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.5) inset',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Leaf Vein line */}
            <div style={{
              width: '2px',
              height: '90%',
              backgroundColor: 'rgba(0, 245, 160, 0.3)',
              transform: 'rotate(15deg)',
            }} />
          </div>

          {/* Disease Spot Visuals on Leaf */}
          {selectedCase.spots.map((spot, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                top: spot.top,
                left: spot.left,
                width: spot.w,
                height: spot.h,
                borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                backgroundColor: 'rgba(180, 83, 9, 0.75)',
                border: '1px solid rgba(245, 158, 11, 0.8)',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                zIndex: 5,
              }}
            />
          ))}

          {/* AI Bounding Box Reticle */}
          <div style={{
            position: 'absolute',
            top: selectedCase.spotY,
            left: selectedCase.spotX,
            transform: 'translate(-50%, -50%)',
            width: selectedCase.spotWidth,
            height: selectedCase.spotHeight,
            border: '2px dashed #00F5A0',
            backgroundColor: 'rgba(0, 245, 160, 0.08)',
            boxShadow: '0 0 16px rgba(0, 245, 160, 0.4)',
            zIndex: 12,
            transition: 'all 0.4s ease',
          }}>
            {/* Box Corners */}
            <div style={{ position: 'absolute', top: -3, left: -3, width: 8, height: 8, borderTop: '3px solid #00F5A0', borderLeft: '3px solid #00F5A0' }} />
            <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderTop: '3px solid #00F5A0', borderRight: '3px solid #00F5A0' }} />
            <div style={{ position: 'absolute', bottom: -3, left: -3, width: 8, height: 8, borderBottom: '3px solid #00F5A0', borderLeft: '3px solid #00F5A0' }} />
            <div style={{ position: 'absolute', bottom: -3, right: -3, width: 8, height: 8, borderBottom: '3px solid #00F5A0', borderRight: '3px solid #00F5A0' }} />

            {/* Floating Tag */}
            <div style={{
              position: 'absolute',
              top: -22,
              left: 0,
              backgroundColor: '#00F5A0',
              color: '#06090E',
              fontSize: '10px',
              fontWeight: 900,
              padding: '2px 6px',
              borderRadius: '2px',
              fontFamily: '"JetBrains Mono", monospace',
              whiteSpace: 'nowrap',
            }}>
              {selectedCase.diseaseName.split('(')[0]} · {selectedCase.confidence}%
            </div>
          </div>

          {/* Viewport Meta Details */}
          <div style={{ position: 'relative', zIndex: 15, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: 10,
              fontFamily: '"JetBrains Mono", monospace',
              color: '#00F5A0',
              backgroundColor: 'rgba(6, 9, 14, 0.8)',
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid rgba(0, 245, 160, 0.3)',
            }}>
              CAM: MACRO OPTICAL // 1080P
            </span>
            <span style={{
              fontSize: 10,
              fontFamily: '"JetBrains Mono", monospace',
              color: '#94A3B8',
              backgroundColor: 'rgba(6, 9, 14, 0.8)',
              padding: '3px 8px',
              borderRadius: 4,
            }}>
              VÙNG: {selectedCase.region}
            </span>
          </div>

          <div style={{ position: 'relative', zIndex: 15 }}>
            <div style={{
              fontSize: 11,
              color: '#F8FAFC',
              backgroundColor: 'rgba(6, 9, 14, 0.85)',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #1B2537',
              lineHeight: 1.4,
            }}>
              <strong style={{ color: '#00F5A0' }}>Triệu chứng thực địa:</strong> {selectedCase.symptomDesc}
            </div>
          </div>
        </div>

        {/* Right: Prescriptive Action Dossier */}
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
      </div>
    </div>
  );
}

export default DiagnosticSimulator;
