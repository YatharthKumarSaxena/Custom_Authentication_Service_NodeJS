// src/services/factories/notification.factory.js

const { getFrontendUrl } = require("@utils/url.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { generateEmailHtml } = require("@utils/email-generator.util");
const { generateSmsMessage } = require("@utils/sms-generator.util");
const { VerifyMode } = require("@configs/enums.config");
const { errorMessage } = require("@utils/error-handler.util"); // Path fix kar lena

const SendNotificationFactory = async(user, contactModes, token, type, emailTemplate, smsTemplate, middleUri) => {
    try {
        let frontendUrl = null;
        let emailHtml = null;
        
        if (!token) token = null;
        
        const userName = user.firstName || "User";

        // --- EMAIL LOGIC ---
        if (token) {
            if (type === VerifyMode.LINK) {
                frontendUrl = getFrontendUrl(middleUri, { token });
                emailHtml = generateEmailHtml(emailTemplate, { 
                    name: userName, 
                    frontendUrl: frontendUrl 
                });
            } else {
                emailHtml = generateEmailHtml(emailTemplate, { 
                    name: userName, 
                    otp: token 
                });
            }
        } else {
            emailHtml = generateEmailHtml(emailTemplate, { 
                name: userName
            });
        }

        // --- SMS LOGIC ---
        const smsMessage = generateSmsMessage(smsTemplate, token);

        // --- DISPATCH ---
        const notificationPayload = {
            user: user,
            contactModes: contactModes,
            email: emailHtml,
            sms: smsMessage
        };

        await sendNotification(notificationPayload);
        return true;

    } catch (err) {
        logWithTime("ERROR", `Notification Factory Failed: ${err.message}`);
        errorMessage(err); 
        return false;
    }
};

module.exports = { SendNotificationFactory };