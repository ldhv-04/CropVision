/**
 * WorkflowThreeSteps — 3 Bước vận hành trực quan, dễ nắm bắt cho mọi lứa tuổi
 */

import React from 'react';

const STEPS = [
  {
    step: '01',
    icon: '📸',
    title: 'Chụp Ảnh Lá Cây Cần Kiểm Tra',
    desc: 'Đưa camera điện thoại lại gần chiếc lá nghi có bệnh. Hệ thống tự động bắt nét, cân bằng sáng và khử rung mà không đòi hỏi thiết bị đắt tiền.',
    highlight: 'Dùng mượt trên mọi điện thoại thông minh',
  },
  {
    step: '02',
    icon: '⚡',
    title: 'Xem Chẩn Đoán & Phác Đồ Định Lượng',
    desc: 'Trong 0.3 giây, AI khoanh vùng vết nấm, đọc tên bệnh chuẩn xác và kê rõ tên hoạt chất, liều pha theo lít nước, thời điểm phun tối ưu.',
    highlight: 'Tiết kiệm 80% thời gian chờ đợi chuyên gia',
  },
  {
    step: '03',
    icon: '🗺️',
    title: 'Khoanh Vùng Xử Lý Trên Bản Đồ',
    desc: 'Vị trí bệnh được ghim chính xác lên bản đồ vệ tinh nông trường. Chỉ cần xịt đúng luống bị nhiễm thay vì phun bừa bãi toàn bộ khu vườn.',
    highlight: 'Cắt giảm 35% tiền mua thuốc bảo vệ thực vật',
  },
];

export function WorkflowThreeSteps() {
  return (
    <section style={{
      padding: '80px 24px',
      backgroundColor: '#06090E',
      borderTop: '1px solid #1B2537',
      borderBottom: '1px solid #1B2537',
    }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* Section Heading */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#00F5A0',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '1.2px',
            marginBottom: '8px',
          }}>
            QUY TRÌNH THỰC ĐỊA 3 BƯỚC
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 900,
            color: '#F8FAFC',
            margin: '0 0 16px 0',
          }}>
            Đơn Giản Đến Bất Ngờ. Ai Cũng Dùng Được.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#94A3B8',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Loại bỏ các giao diện công nghệ rườm rà. CropVision được tinh giản tối đa để người lớn tuổi và nhà nông thực địa thao tác chính xác chỉ sau 2 phút làm quen.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                borderRadius: '12px',
                backgroundColor: '#0D1320',
                border: '1px solid #1B2537',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00F5A0';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1B2537';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {/* Step Number Watermark */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '18px',
                fontSize: '48px',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.04)',
                fontFamily: '"JetBrains Mono", monospace',
                lineHeight: 1,
                pointerEvents: 'none',
              }}>
                {s.step}
              </div>

              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 245, 160, 0.1)',
                  border: '1px solid rgba(0, 245, 160, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: '20px',
                }}>
                  {s.icon}
                </div>

                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#00F5A0',
                  fontFamily: '"JetBrains Mono", monospace',
                  marginBottom: '6px',
                }}>
                  BƯỚC {s.step}
                </div>

                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#F8FAFC',
                  margin: '0 0 12px 0',
                  lineHeight: 1.3,
                }}>
                  {s.title}
                </h3>

                <p style={{
                  fontSize: '13.5px',
                  color: '#94A3B8',
                  lineHeight: 1.6,
                  margin: '0 0 20px 0',
                }}>
                  {s.desc}
                </p>
              </div>

              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 210, 255, 0.06)',
                border: '1px solid rgba(0, 210, 255, 0.2)',
                fontSize: '12px',
                fontWeight: 700,
                color: '#00D2FF',
              }}>
                ✓ {s.highlight}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WorkflowThreeSteps;
