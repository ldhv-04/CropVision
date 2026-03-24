const { Resend } = require('resend');
require('dotenv').config();

// Khởi tạo SDK với API Key từ biến môi trường
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async (toEmail, otpCode) => {
  try {
    const data = await resend.emails.send({
      // [QUAN TRỌNG]: Khi chưa mua tên miền riêng, bạn bắt buộc phải dùng email onboarding này làm người gửi
      from: 'CropVision AI <onboarding@resend.dev>', 
      to: [toEmail],
      subject: 'Mã xác thực tài khoản CropVision AI',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; border: 1px solid #334155; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #0f172a;">Chào mừng bạn đến với CropVision AI</h2>
          <p style="color: #475569; font-size: 16px;">Mã xác thực (OTP) của bạn là:</p>
          <h1 style="color: #22c55e; letter-spacing: 5px; font-size: 36px; background-color: #f8fafc; padding: 10px; border-radius: 4px;">
            ${otpCode}
          </h1>
          <p style="color: #475569; font-size: 14px;">Mã này sẽ hết hạn trong 15 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        </div>
      `
    });

    console.log(`Đã yêu cầu Resend gửi OTP tới ${toEmail}. ID Email:`, data.id);
    return data;
  } catch (error) {
    console.error('Lỗi khi gọi API Resend:', error);
    throw new Error('Hệ thống gửi email đang gián đoạn.');
  }
};

module.exports = {
  sendOTP
};