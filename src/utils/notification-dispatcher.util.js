// src/utils/notification.util.js

const { ContactModes } = require("../configs/enums.config");
const { sendEmail } = require("@services/mail.service");
const { sendSMS } = require("../services/sms.service");
const { generateEmailHtml } = require("./email-generator.util");
const { generateSmsMessage } = require("./sms-generator.util");
const { logWithTime } = require("./time-stamps.util");

/**
 * 🚀 Flexible Notification Dispatcher
 * - Use WITHOUT await: Fire-and-forget (signup, verification generation)
 * - Use WITH await: Wait for confirmation (resend verification, critical flows)
 * 
 * @param {object} contactInfo - { email, phone, contactMode }
 * @param {object} emailTemplate - Config Object
 * @param {object} smsTemplate - Config Object
 * @param {object} data - Dynamic Data
 * @returns {Promise<{emailSent: boolean, smsSent: boolean}>} - Success status
 */
const sendNotification = async ({
    contactInfo, 
    emailTemplate = null, 
    smsTemplate = null, 
    data = {} 
}) => {
    try {
        const { email, phone, contactMode } = contactInfo;
        
        let emailSent = false;
        let smsSent = false;

        // 1️⃣ Flag Logic
        const shouldSendEmail = (
            (contactMode === ContactModes.EMAIL || contactMode === ContactModes.BOTH) && 
            email && 
            emailTemplate
        );

        const shouldSendSMS = (
            (contactMode === ContactModes.PHONE || contactMode === ContactModes.BOTH) && 
            phone && 
            smsTemplate
        );

        // 2️⃣ EMAIL - Execute and track
        if (shouldSendEmail) {
            const emailContent = generateEmailHtml(emailTemplate, { name: data.name, ...data });
            if (emailContent) {
                try {
                    await sendEmail(email, emailContent.subject, emailContent.html);
                    emailSent = true;
                    logWithTime("INFO", `📧 Email sent to ${email}`);
                } catch (error) {
                    logWithTime("ERROR", `❌ Email Error: ${error.message}`);
                }
            }
        }

        // 3️⃣ SMS - Execute and track
        if (shouldSendSMS) {
            const smsMessage = generateSmsMessage(smsTemplate, data.otp);
            if (smsMessage) {
                try {
                    await sendSMS(phone, smsMessage);
                    smsSent = true;
                    logWithTime("INFO", `📱 SMS sent to ${phone}`);
                } catch (error) {
                    logWithTime("ERROR", `❌ SMS Error: ${error.message}`);
                }
            }
        }

        return { emailSent, smsSent, success: emailSent || smsSent };

    } catch (error) {
        logWithTime("ERROR", `❌ Notification Dispatch Error: ${error.message}`);
        return { emailSent: false, smsSent: false, success: false };
    }
};

module.exports = { sendNotification };