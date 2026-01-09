const nodemailer = require("nodemailer");
const { logWithTime } = require("@utils/time-stamps.util");
const { generateMasterTemplate } = require("./templates");

/**
 * 📧 Core Mail Service using SMTP
 * Handles SMTP configuration and core email sending logic
 */

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * 🚀 Generic Fire-and-Forget Email Sender
 * @param {string} to - Recipient email
 * @param {Object} templateConfig - Template configuration object
 */
const sendEmail = async (to, templateConfig) => {
  try {
    if (!to) {
      logWithTime(`⚠️ Email not sent - recipient email is empty`);
      return;
    }

    const config = { ...templateConfig };
    const htmlContent = generateMasterTemplate(config);
    const transporter = createTransporter();
    
    const emailConfig = {
      from: process.env.EMAIL_FROM || `"${process.env.EMAIL_FROM_NAME || 'Admin Panel'}" <${process.env.SMTP_USER}>`,
      to: to,
      subject: config.subject,
      html: htmlContent,
    };

    transporter.sendMail(emailConfig, (error, info) => {
      if (error) {
        logWithTime(`❌ Email send failed to ${to}: ${error.message}`);
      } else {
        logWithTime(`✅ Email sent to ${to}: ${info.messageId}`);
      }
    });

  } catch (error) {
    logWithTime(`❌ Email service error: ${error.message}`);
  }
};

module.exports = {
  sendEmail,
  createTransporter
};