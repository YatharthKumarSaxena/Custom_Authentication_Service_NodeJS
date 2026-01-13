const { VerificationPurpose } = require("@configs/enums.config");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { FRONTEND_ROUTES } = require("@configs/frontend-routes.config");

/**
 * 🗺️ Verification Mapping
 * Maps each purpose to its respective templates and routes.
 */
const VerificationTemplateMapping = Object.freeze({
    [VerificationPurpose.FORGOT_PASSWORD]: {
        emailTemplate: userTemplate.forgotPassword,
        smsTemplate: userSmsTemplate.forgotPassword,
        route: FRONTEND_ROUTES.RESET_PASSWORD
    },
    [VerificationPurpose.EMAIL_VERIFICATION]: {
        emailTemplate: userTemplate.verification,
        smsTemplate: null,
        route: FRONTEND_ROUTES.VERIFY_EMAIL
    },
    [VerificationPurpose.PHONE_VERIFICATION]: {
        emailTemplate: null,
        smsTemplate: userSmsTemplate.verification,
        route: null
    },
    [VerificationPurpose.DEVICE_VERIFICATION]: {
        emailTemplate: userTemplate.deviceVerification,
        smsTemplate: userSmsTemplate.deviceVerification,
        route: FRONTEND_ROUTES.VERIFY_DEVICE
    }
});

module.exports = { VerificationTemplateMapping };