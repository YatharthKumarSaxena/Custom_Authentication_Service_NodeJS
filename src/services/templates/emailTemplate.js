const { defaultConfig } = require("@configs/email.config");

/**
 * 👤 User Email Templates
 * Covers Registration, Login, Security, and Profile Updates
 */
const userTemplate = {

    // ==========================================
    // 1️⃣ REGISTRATION & VERIFICATION EVENTS
    // ==========================================

    // 🔹 Verification (Sign Up / New Email)
    verification: {
        ...defaultConfig,
        subject: "🔐 Verify Your Email Address",
        event_name: "Account Verification",
        action: "Verify Email",
        status: "Pending", // 🟡 Yellow Badge
        message_intro: "Thank you for signing up! Please verify your email address to activate your account.",
        actionbutton_text: "Verify Account",
        actionlink: "<LINK>/verify-email", // Frontend URL
        fallback_note: "Or enter this OTP manually: {{otp}}",
        action_link: "<LINK>/verify-email",
        notes: "This link/OTP is valid for 10 minutes only.",
        details: {} // OTP, Expiry
    },

    // 🔹 Welcome Email (After Successful Verification)
    welcome: {
        ...defaultConfig,
        subject: "🎉 Welcome to our Platform!",
        event_name: "Registration Successful",
        action: "Account Active",
        status: "Activated", // 🟢 Green Badge
        message_intro: "Your account has been successfully verified and activated.",
        actionbutton_text: "Go to Dashboard",
        actionlink: "<LINK>/dashboard",
        fallback_note: "Start exploring now:",
        action_link: "<LINK>/dashboard",
        notes: "We are excited to have you on board!",
        details: {} // User Name, Member Since
    },

    // ==========================================
    // 2️⃣ PASSWORD & SECURITY EVENTS
    // ==========================================

    // 🔹 Forgot Password Request
    forgotPassword: {
        ...defaultConfig,
        subject: "🔑 Reset Your Password",
        event_name: "Password Reset Request",
        action: "Reset Password",
        status: "Pending",
        message_intro: "We received a request to reset your password.",
        actionbutton_text: "Reset Password",
        actionlink: "<LINK>/reset-password",
        fallback_note: "Or use this OTP: {{otp}}",
        action_link: "<LINK>/reset-password",
        notes: "If you didn't request this, you can safely ignore this email. Your password will not change.",
        details: {} // IP Address, Time
    },

    // 🔹 Password Changed Confirmation
    passwordChanged: {
        ...defaultConfig,
        subject: "✅ Password Changed Successfully",
        event_name: "Password Updated",
        action: "Security Update",
        status: "Success",
        message_intro: "Your account password has been changed successfully.",
        notes: "If you did not make this change, please contact support immediately.",
        details: {} // Device, IP, Time
    },

    // 🔹 New Device / Suspicious Login Alert
    newDeviceLogin: {
        ...defaultConfig,
        subject: "⚠️ New Login Detected",
        event_name: "New Device Login",
        action: "Security Alert",
        status: "Warning", // 🟡 Yellow/Orange
        message_intro: "We noticed a login to your account from a new device or location.",
        notes: "If this was you, you can ignore this email.\nIf not, please reset your password immediately.",
        details: {} // Browser, OS, IP Address, Location, Time
    },

    // 🔹 Logout All Devices
    logoutAllDevices: {
        ...defaultConfig,
        subject: "🔒 Logged Out From All Devices",
        event_name: "Security Action",
        action: "Global Logout",
        status: "Success",
        message_intro: "You have been successfully logged out from all active sessions and devices.",
        actionbutton_text: "Login Again",
        actionlink: "<LINK>/login",
        action_link: "<LINK>/login",
        notes: "You will need to sign in again on all your devices.",
        details: {} // Time, IP
    },

    // ==========================================
    // 3️⃣ ACCOUNT STATUS EVENTS (Activate/Deactivate)
    // ==========================================

    // 🔹 Account Deactivated (By User)
    accountDeactivated: {
        ...defaultConfig,
        subject: "👋 Your Account Has Been Deactivated",
        event_name: "Account Deactivation",
        action: "Deactivated",
        status: "Deactivated", // 🔴 Red Badge
        message_intro: "As requested, your account has been deactivated.",
        notes: "We are sorry to see you go. You can reactivate your account anytime by logging in within 30 days.",
        details: {} // Deactivated At
    },

    // 🔹 Account Reactivated (Welcome Back)
    accountReactivated: {
        ...defaultConfig,
        subject: "🎉 Welcome Back! Account Reactivated",
        event_name: "Account Reactivation",
        action: "Reactivated",
        status: "Activated",
        message_intro: "Your account has been successfully reactivated.",
        actionbutton_text: "Go to Dashboard",
        actionlink: "<LINK>/dashboard",
        fallback_note: "Continue where you left off:",
        action_link: "<LINK>/dashboard",
        notes: "All your data has been restored.",
        details: {} // Reactivated At
    },

    // ==========================================
    // 4️⃣ UPDATE ACCOUNT DETAILS (Email/Phone Change)
    // ==========================================

    // 🔹 Verify New Email (When email is updated)
    verifyNewEmail: {
        ...defaultConfig,
        subject: "📧 Verify Your New Email Address",
        event_name: "Email Update Verification",
        action: "Verify Change",
        status: "Pending",
        message_intro: "You requested to change your email address. Please verify this new address.",
        actionbutton_text: "Verify New Email",
        actionlink: "<LINK>/verify-change",
        fallback_note: "Or use this OTP: {{otp}}",
        action_link: "<LINK>/verify-change",
        notes: "Your email will not be updated until you verify this link.",
        details: {} // Old Email (masked), New Email
    },

    // 🔹 Profile Details Updated (Name, Bio, etc. - No Verify needed)
    profileUpdated: {
        ...defaultConfig,
        subject: "📝 Account Details Updated",
        event_name: "Profile Update",
        action: "Details Updated",
        status: "Success",
        message_intro: "Your account details have been updated successfully.",
        notes: "If you did not make these changes, please secure your account.",
        details: {} // Updated Fields (e.g., "Name, Address"), Time
    },
    // 🔹 2FA Login OTP (Jab banda login kare aur 2FA ON ho)
    twoFactorLoginOTP: {
        ...defaultConfig,
        subject: "🔐 Login Verification Code",
        event_name: "2FA Login Attempt",
        action: "Login Verification",
        status: "Pending", // 🟡 Yellow Badge
        message_intro: "A login attempt was made to your account. Please enter the code below to complete the login.",

        // OTP usually details ya notes mein dikhaya jata hai
        notes: "Your Verification Code is:\n\n👉 {{otp}}\n\nThis code expires in 10 minutes.",

        // Yahan button ki zaroorat nahi hai, ya fir "It wasn't me" button de sakte ho
        action_cta: "Did not request this code?",
        actionbutton_text: "Secure My Account",
        actionlink: "<LINK>/reset-password", // Agar user ne nahi kiya, to password reset kare
        action_link: "<LINK>/reset-password",

        details: {} // IP Address, Browser, Location, Time
    },

    // ==========================================
    // 2️⃣ 2FA SETTINGS EVENTS (Enable/Disable)
    // ==========================================

    // 🔹 2FA Enabled Successfully
    twoFactorEnabled: {
        ...defaultConfig,
        subject: "🛡️ Two-Factor Authentication Enabled",
        event_name: "Security Update",
        action: "2FA Enabled",
        status: "Success", // 🟢 Green Badge
        message_intro: "Two-factor authentication has been successfully enabled for your account.",
        notes: "Your account is now more secure. You will need a verification code every time you login from a new device.",
        details: {} // Method (Email/App), Enabled At
    },

    // 🔹 2FA Disabled (High Risk Alert!)
    twoFactorDisabled: {
        ...defaultConfig,
        subject: "⚠️ Two-Factor Authentication Disabled",
        event_name: "Security Alert",
        action: "2FA Disabled",
        status: "Deactivated", // 🔴 Red Badge
        message_intro: "Two-factor authentication was turned off for your account.",
        notes: "Your account is now less secure.\n\nIf you did not make this change, please lock your account immediately.",

        action_cta: "Not you?",
        actionbutton_text: "Secure Account",
        actionlink: "<LINK>/reset-password",
        action_link: "<LINK>/reset-password",
        details: {} // Disabled By (IP), Time
    },

    // 🔹 Email Change Notification (Sent to OLD Email)
    emailChangeAlert: {
        ...defaultConfig,
        subject: "⚠️ Security Alert: Email Address Changed",
        event_name: "Email Change Alert",
        action: "Security Warning",
        status: "Warning",
        message_intro: "The email address associated with your account was recently changed to {{new_email}}.",
        actionbutton_text: "I did not do this",
        actionlink: "<LINK>/revert-email-change",
        action_link: "<LINK>/revert-email-change",
        notes: "If you authorized this change, you can safely ignore this email. If not, click the button above immediately to lock your account.",
        details: {} // Time, IP, New Email
    },
    // ==========================================
    // 🛡️ DEVICE & MFA VERIFICATION
    // ==========================================

    // 🔹 Device Verification (New Device Authorization)
    deviceVerification: {
        ...defaultConfig,
        subject: "💻 Authorize New Device",
        event_name: "Device Authorization",
        action: "Verify Device",
        status: "Pending", // 🟡 Yellow Badge
        message_intro: "You are trying to log in from a new device or browser. Please authorize this device to continue.",

        // Dono options rakhte hain: Button for Link, OTP for manual entry
        actionbutton_text: "Authorize This Device",
        actionlink: "<LINK>/verify-device?token={{token}}",
        fallback_note: "Or enter this Device Authorization Code: {{otp}}",

        notes: "This authorization request will expire in 10 minutes. If this wasn't you, someone might have your password. Please change it immediately.",

        details: {} // Browser, OS, Location, IP Address
    }
};

module.exports = {
    userTemplate
};