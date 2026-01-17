const nodemailer = require("nodemailer");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * 📧 Core Mail Service
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail", // 'host' aur 'port' ki jagah simple 'service' use karo Gmail ke liye
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // ⚠️ Note: .env mein check karna ye SMTP_PASS hai ya SMTP_PASSWORD
    },
  });
};

const transporter = createTransporter();

/**
 * 🚀 Email Sender with Await Support
 * @param {string} to - Recipient email
 * @param {string} subject - Email Subject
 * @param {string} htmlContent - Final HTML String
 */
const sendEmail = async (to, subject, htmlContent) => {
  if (!to) {
    logWithTime(`⚠️ Email skipped: No recipient.`);
    return false;
  }

  const emailConfig = {
    from: process.env.EMAIL_FROM || `"${process.env.APP_NAME || 'Admin'}" <${process.env.SMTP_USER}>`,
    to: to,
    subject: subject,
    html: htmlContent,
  };

  try {
    // ✅ Yahan hum AWAIT kar rahe hain taaki process kill na ho jaye
    const info = await transporter.sendMail(emailConfig);
    
    logWithTime(`✅ [Email Sent] Message ID: ${info.messageId} to ${to}`);
    return true;

  } catch (error) {
    logWithTime(`❌ [Email Failed] Error: ${error.message}`);
    return false;
  }
};

module.exports = { sendEmail };