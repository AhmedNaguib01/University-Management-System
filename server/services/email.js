const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"EduVerse" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request - EduVerse",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">EduVerse</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">
            You requested to reset your password. Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; line-height: 1.6;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            If the button doesn't work, copy and paste this link: ${resetUrl}
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };
