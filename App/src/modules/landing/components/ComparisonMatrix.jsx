/**
 * ComparisonMatrix — Bảng đối chiếu thực tế: Phương pháp cũ vs. CropVision AI
 */

import React from 'react';

const COMPARISON_ROWS = [
  {
    criteria: 'Thời điểm phát hiện dịch bệnh',
    traditional: 'Nhìn bằng mắt thường khi lá đã vàng úa, đốm loét lan rộng (đã muộn, rụng lá hàng loạt).',
    cropvision: 'Nhận diện đốm nấm và bào tử ở giai đoạn vi mô trong 0.3s ngay khi mới chớm bệnh.',
    impact: 'Chặn đứng dịch bệnh trước 48h',
  },
  {
    criteria: 'Lựa chọn thuốc & Liều lượng',
    traditional: 'Đoán bệnh cảm tính hoặc mua theo đại lý chào mời, dễ pha quá liều gây cháy lá hoặc lờn thuốc.',
    cropvision: 'Chỉ định đúng tên hoạt chất khoa học, hướng dẫn tỷ lệ pha theo lít nước và thời điểm phun vàng.',
    impact: 'Không lo lờn thuốc hay tồn dư BVTV',
  },
  {
    criteria: 'Phạm vi & Chi phí phun xịt',
    traditional: 'Lo sợ lây lan nên phun phòng mù quáng toàn bộ vườn 5-10 hecta, tốn hàng chục triệu đồng tiền thuốc.',
    cropvision: 'Bản đồ vệ tinh khoanh vùng chính xác ổ dịch, chỉ xịt đúng 2 luống bị nhiễm.',
    impact: 'Cắt giảm 35% - 40% chi phí phân thuốc',
  },
  {
    criteria: 'Theo dõi đất đai & Khí hậu',
    traditional: 'Chỉ biết đất chua/thiếu ẩm khi cây đã còi cọc, héo rũ.',
    cropvision: 'Quan trắc liên tục pH đất, độ ẩm tầng rễ và cảnh báo nhiệt độ cao qua cảm biến IoT.',
    impact: 'Chủ động điều tiết trước khi rễ nghẹt',
  },
];

export function ComparisonMatrix() {
  return (
    <section style={{
      padding: '80px 24px',
      backgroundColor: '#0D1320',
      borderBottom: '1px solid #1B2537',
    }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* Section Heading */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#00D2FF',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '1.2px',
            marginBottom: '8px',
          }}>
            ĐỐI CHIẾU HIỆU QUẢ KINH TẾ
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: 900,
            color: '#F8FAFC',
            margin: '0 0 16px 0',
          }}>
            Cách Làm Cũ vs. Đột Phá Cùng CropVision
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#94A3B8',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Tại sao các nông trường lớn và hợp tác xã chuyển dịch sang công nghệ quang học thực chứng?
          </p>
        </div>

        {/* Table Matrix Container */}
        <div style={{
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#06090E',
          border: '1px solid #1B2537',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(220px, 1.6fr) minmax(260px, 2fr)',
            backgroundColor: '#06090E',
            borderBottom: '1px solid #1B2537',
            padding: '16px 20px',
            gap: '16px',
          }} className="matrix-row">
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', fontFamily: '"JetBrains Mono", monospace' }}>
              TIÊU CHÍ NÔNG HỌC
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#FF2E54', fontFamily: '"JetBrains Mono", monospace' }}>
              ✕ CÁCH LÀM TRUYỀN THỐNG
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#00F5A0', fontFamily: '"JetBrains Mono", monospace' }}>
              ✓ ỨNG DỤNG CROPVISION AI
            </div>
          </div>

          {/* Table Rows */}
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(220px, 1.6fr) minmax(260px, 2fr)',
                padding: '20px',
                borderBottom: i < COMPARISON_ROWS.length - 1 ? '1px solid #1B2537' : 'none',
                backgroundColor: i % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                gap: '16px',
                alignItems: 'center',
              }}
              className="matrix-row"
            >
              {/* Criteria */}
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#F8FAFC' }}>
                  {row.criteria}
                </div>
              </div>

              {/* Traditional */}
              <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, paddingRight: '12px' }}>
                {row.traditional}
              </div>

              {/* CropVision */}
              <div>
                <div style={{ fontSize: '13.5px', color: '#F8FAFC', fontWeight: 600, lineHeight: 1.5, marginBottom: '6px' }}>
                  {row.cropvision}
                </div>
                <div style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#00F5A0',
                  backgroundColor: 'rgba(0, 245, 160, 0.1)',
                  border: '1px solid rgba(0, 245, 160, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  ➔ {row.impact}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ComparisonMatrix;
