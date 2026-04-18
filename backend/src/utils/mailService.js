const { Resend } = require('resend');
require('dotenv').config();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const sendOTP = async (toEmail, otpCode) => {
  if (!resend) {
    throw new Error('RESEND_API_KEY chua duoc cau hinh.');
  }

  try {
    const data = await resend.emails.send({
      from: 'CropVision AI <onboarding@resend.dev>',
      to: [toEmail],
      subject: 'Ma xac thuc tai khoan CropVision AI',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; border: 1px solid #334155; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #0f172a;">Chao mung ban den voi CropVision AI</h2>
          <p style="color: #475569; font-size: 16px;">Ma xac thuc (OTP) cua ban la:</p>
          <h1 style="color: #22c55e; letter-spacing: 5px; font-size: 36px; background-color: #f8fafc; padding: 10px; border-radius: 4px;">
            ${otpCode}
          </h1>
          <p style="color: #475569; font-size: 14px;">Ma nay se het han trong 15 phut. Vui long khong chia se ma nay cho bat ky ai.</p>
        </div>
      `,
    });

    console.info(`[Mail] OTP sent → ${toEmail} (Resend id=${data.id})`);
    return data;
  } catch (error) {
    console.error('Loi khi goi API Resend:', error);
    throw new Error('He thong gui email dang gian doan.');
  }
};

module.exports = {
  sendOTP,
};
