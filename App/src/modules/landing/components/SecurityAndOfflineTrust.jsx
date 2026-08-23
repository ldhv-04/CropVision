/**
 * SecurityAndOfflineTrust — Cam kết hoạt động ngoại tuyến & bảo mật dữ liệu nông hộ
 */

import React from 'react';

const TRUST_POINTS = [
  {
    icon: '📶',
    title: 'Hoạt Động Mượt Cả Khi Mất Sóng (Offline AI)',
    desc: 'Mô hình AI nhúng trực tiếp trên ứng dụng di động. Bạn có thể đứng giữa rẫy xa, vùng đồi núi không có sóng 4G/Wifi vẫn chụp và nhận diện bệnh bình thường.',
    tag: 'CHẠY TRỰC TIẾP ON-DEVICE',
  },
  {
    icon: '🔒',
    title: 'Bảo Mật Quyền Sở Hữu Đất Đai 100%',
    desc: 'Tọa độ ranh giới nông trường, số liệu sản lượng và lịch sử phân thuốc của bạn được mã hóa an toàn. Không chia sẻ cho bất kỳ bên thứ ba nào.',
    tag: 'MÃ HÓA CẤP DOANH NGHIỆP',
  },
  {
    icon: '🔄',
    title: 'Tự Động Đồng Bộ Khi Trở Lại Vùng Có Sóng',
    desc: 'Mọi mẫu bệnh, ảnh chụp và nhật ký thực địa sẽ tự động đồng bộ lên Trạm Điều Hành Station ngay khi điện thoại bắt được kết nối Internet.',
    tag: 'ĐỒNG BỘ NỀN THÔNG MINH',
  },
];

export function SecurityAndOfflineTrust() {
  return (
    <section style={{
      padding: '80px 24px',
      backgroundColor: '#06090E',
      borderBottom: '1px solid #1B2537',
    }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#00F5A0',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '1.2px',
            marginBottom: '8px',
          }}>
            AN TOÀN THỰC THI & QUYỀN RIÊNG TƯ
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 38px)',
            fontWeight: 900,
            color: '#F8FAFC',
            margin: '0 0 16px 0',
          }}>
            Được Thiết Kế Cho Điều Kiện Thực Địa Khắc Nghiệt
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#94A3B8',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Chúng tôi hiểu rằng đồng ruộng và rẫy nương không phải lúc nào cũng có Internet ổn định.
          </p>
        </div>

        {/* 3 Trust Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {TRUST_POINTS.map((item, i) => (
            <div
              key={i}
              style={{
                borderRadius: '10px',
                backgroundColor: '#0D1320',
                border: '1px solid #1B2537',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{item.icon}</div>
                <div style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#00D2FF',
                  fontFamily: '"JetBrains Mono", monospace',
                  marginBottom: '8px',
                }}>
                  {item.tag}
                </div>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  color: '#F8FAFC',
                  margin: '0 0 12px 0',
                  lineHeight: 1.3,
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: '#94A3B8',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SecurityAndOfflineTrust;
