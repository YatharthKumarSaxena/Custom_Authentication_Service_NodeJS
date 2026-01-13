// src/utils/notification.util.js

const { ContactModes } = require("../configs/enums.config");
const { sendEmail } = require("@services/mail.service");
const { sendSMS } = require("../services/sms.service");
const { generateEmailHtml } = require("./email-generator.util");
const { generateSmsMessage } = require("./sms-generator.util");
const { logWithTime } = require("./time-stamps.util");

/**
 * 🏭 Simplified Notification Dispatcher
 * @param {object} contactInfo - Result from getUserContacts() -> { email, phone, contactMode }
 * @param {object} emailTemplate - Config Object
 * @param {object} smsTemplate - Config Object
 * @param {object} data - Dynamic Data
 */
const sendNotification = async ({
    contactInfo, 
    emailTemplate = null, 
    smsTemplate = null, 
    data = {} 
}) => {
    
    const { email, phone, contactMode } = contactInfo;

    // 1️⃣ Flag Logic (Ab super simple hai)
    
    // Email bhejo agar: Mode allow kare AND Email exist kare AND Template diya ho
    const shouldSendEmail = (
        (contactMode === ContactModes.EMAIL || contactMode === ContactModes.BOTH) && 
        email && 
        emailTemplate
    );

    // SMS bhejo agar: Mode allow kare AND Phone exist kare AND Template diya ho
    const shouldSendSMS = (
        (contactMode === ContactModes.PHONE || contactMode === ContactModes.BOTH) && 
        phone && 
        smsTemplate
    );

    try {
        // 2️⃣ Execution
        
        // --- EMAIL ---
        if (shouldSendEmail) {
            const emailContent = generateEmailHtml(emailTemplate, { name: data.name, ...data });
            if (emailContent) {
                await sendEmail(email, emailContent.subject, emailContent.html);
                logWithTime("INFO", `📧 Email sent to ${email}`);
            }
        }

        // --- SMS ---
        if (shouldSendSMS) {
            const smsMessage = generateSmsMessage(smsTemplate, data.otp);
            if (smsMessage) {
                await sendSMS(phone, smsMessage);
                logWithTime("INFO", `📱 SMS sent to ${phone}`);
            }
        }

    } catch (error) {
        logWithTime("ERROR", `❌ Notification Error: ${error.message}`);
    }
};

module.exports = { sendNotification };