/**
 * welcome.js (Landing Page Entry Route)
 * 
 * Đây là điểm đến đầu tiên cho người dùng chưa đăng nhập (Unauthenticated).
 * Chúng ta thay thế toàn bộ giao diện cũ bằng kiến trúc LandingLayout mới
 * được phân chia module rõ ràng để dễ nâng cấp.
 */

import React from 'react';
import { ThemeProvider } from '../../src/modules/@core/context/ThemeContext';
import { LandingLayout } from '../../src/modules/landing';

export default function WelcomeScreen() {
  return (
    // Bọc ThemeProvider để Landing Page có thể nhận diện Dark/Light mode
    // (hoặc thiết lập màu sắc mặc định đồng bộ với toàn hệ thống).
    <ThemeProvider>
      <LandingLayout />
    </ThemeProvider>
  );
}
