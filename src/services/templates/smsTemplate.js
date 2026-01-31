/**
 * User SMS Templates
 * Short, concise messages with {{otp}} placeholders.
 */
const userSmsTemplate = {

    // REGISTRATION & VERIFICATION

    verification: {
        message: "Your verification code for [App Name] is {{otp}}. Valid for 10 minutes. Do not share this code.",
        dlt_template_id: "1007XXXXXXX"
    },

    registrationSuccess: {
        message: "Welcome to [App Name]! Your account is created. We've sent a verification code to this phone number. Please verify to activate.",
        dlt_template_id: "1007XXXXXXX"
    },

    welcome_super_admin: {
        message: "Super Admin Access Granted for [App Name]. Your account is active. Please login and secure your account immediately.",
        dlt_template_id: "1007XXXXXXX" // Note: Admin templates usually require separate DLT approval
    },
    
    welcome: {
        message: "Welcome to [App Name]! Your account is now active. Log in to start exploring.",
        dlt_template_id: "1007XXXXXXX"
    },

    // PASSWORD & SECURITY EVENTS

    forgotPassword: {
        message: "Use code {{otp}} to reset your [App Name] password. If you didn't request this, ignore this message.",
        dlt_template_id: "1007XXXXXXX"
    },

    passwordChanged: {
        message: "Security Alert: Your [App Name] password was just changed. If this wasn't you, contact support immediately.",
        dlt_template_id: "1007XXXXXXX"
    },

    newDeviceLogin: {
        message: "Alert: New login detected on your [App Name] account. If not you, please reset your password.",
        dlt_template_id: "1007XXXXXXX"
    },

    // 🔹 Logout All Devices (Added)
    logoutAllDevices: {
        message: "Security: You have been logged out from all devices on [App Name]. Log in again to continue.",
        dlt_template_id: "1007XXXXXXX"
    },

    // ACCOUNT STATUS EVENTS

    accountDeactivated: {
        message: "Your [App Name] account has been deactivated. You can reactivate it by logging in within 30 days.",
        dlt_template_id: "1007XXXXXXX"
    },

    // Account Reactivated
    accountReactivated: {
        message: "Welcome back! Your [App Name] account has been reactivated successfully.",
        dlt_template_id: "1007XXXXXXX"
    },

    // ACCOUNT UPDATES & 2FA

    verifyNewPhone: {
        message: "Verify your new phone number. Your code is {{otp}}. Do not share it.",
        dlt_template_id: "1007XXXXXXX"
    },

    // 🔹 Profile Updated (Added)
    profileUpdated: {
        message: "Alert: Your [App Name] profile details were updated. If not done by you, secure your account.",
        dlt_template_id: "1007XXXXXXX"
    },

    twoFactorLoginOTP: {
        message: "{{otp}} is your secure login code for [App Name]. Valid for 10 minutes.",
        dlt_template_id: "1007XXXXXXX"
    },

    // 2FA Enabled (Added)
    twoFactorEnabled: {
        message: "Security: Two-Factor Authentication (2FA) is now enabled on your [App Name] account.",
        dlt_template_id: "1007XXXXXXX"
    },

    twoFactorDisabled: {
        message: "Security Alert: 2FA has been disabled for your [App Name] account. Enable it again if this was a mistake.",
        dlt_template_id: "1007XXXXXXX"
    },
    
    phoneChangeAlert: {
        message: "Alert: The phone number for your [App Name] account was changed. If you did not authorize this, contact support.",
        dlt_template_id: "1007XXXXXXX"
    },

    deviceVerification: {
        message: "Code: {{otp}} is your verification code to authorize a new device on [App Name]. Valid for 10 minutes.",
        dlt_template_id: "1007XXXXXXX"
    }
};

module.exports = {
    userSmsTemplate
};