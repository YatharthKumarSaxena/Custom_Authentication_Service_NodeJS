const { sendEmail } = require("@services/mail.service");
const { sendSMS } = require("@services/sms.service");
const { adminTemplate } = require("@services/templates");
const { smsTemplate } = require("@services/templates");
const { AuthModes } = require("@configs/enums.config");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * 🏭 Notification Dispatcher Factory
 * Sends email/SMS based on AUTH_MODE
 * Handles EITHER mode by checking which field exists
 */

/**
 * 📤 Send notification based on auth mode (NEW FACTORY APPROACH)
 * @param {Object} recipient - {email, fullPhoneNumber, adminId, adminType}
 * @param {String} templateName - Name of template in adminTemplate/smsTemplate
 * @param {Object} emailData - Data object for email template
 * @param {Array} smsArgs - Arguments array for SMS template function
 */

const sendNotificationFactory = (recipient, templateName, emailData = {}, smsArgs = []) => {
  if (!recipient) {
    logWithTime("⚠️ No recipient provided for notification");
    return;
  }

  const authMode = process.env.DEFAULT_AUTH_MODE || AuthModes.BOTH;
  const { email, fullPhoneNumber, adminId, adminType } = recipient;

  try {
    switch (authMode) {
      case AuthModes.EMAIL:
        // Only email
        if (email) {
          sendEmailNotification(email, templateName, emailData, adminType || 'Admin');
        } else {
          logWithTime(`⚠️ Email not available for ${adminId}`);
        }
        break;

      case AuthModes.PHONE:
        // Only SMS
        if (fullPhoneNumber) {
          sendSMSNotification(fullPhoneNumber, templateName, smsArgs);
        } else {
          logWithTime(`⚠️ Phone number not available for ${adminId}`);
        }
        break;

      case AuthModes.BOTH:
        // Both email and SMS
        if (email) {
          sendEmailNotification(email, templateName, emailData, adminType || 'Admin');
        }
        if (fullPhoneNumber) {
          sendSMSNotification(fullPhoneNumber, templateName, smsArgs);
        }
        if (!email && !fullPhoneNumber) {
          logWithTime(`⚠️ Neither email nor phone available for ${adminId}`);
        }
        break;

      case AuthModes.EITHER:
        // Send to whichever exists (priority: email)
        if (email) {
          sendEmailNotification(email, templateName, emailData, adminType || 'Admin');
        } else if (fullPhoneNumber) {
          sendSMSNotification(fullPhoneNumber, templateName, smsArgs);
        } else {
          logWithTime(`⚠️ Neither email nor phone available for ${adminId}`);
        }
        break;

      default:
        logWithTime(`⚠️ Unknown auth mode: ${authMode}`);
    }
  } catch (error) {
    logWithTime(`❌ Error sending notification: ${error.message}`);
  }
};

/**
 * 📧 Send email notification
 */
const sendEmailNotification = (email, templateName, emailData, userName = 'Admin') => {
  try {
    const template = adminTemplate[templateName];
    
    if (!template) {
      logWithTime(`⚠️ Email template not found: ${templateName}`);
      return;
    }

    const config = {
      ...template,
      user_name: userName,
      details: emailData.details || {}
    };

    // Replace dynamic links if present
    if (config.actionlink) {
      config.actionlink = config.actionlink.replace('<ADMIN_PANEL_LINK>', process.env.ADMIN_PANEL_LINK || '#');
    }
    if (config.action_link) {
      config.action_link = config.action_link.replace('<ADMIN_PANEL_LINK>', process.env.ADMIN_PANEL_LINK || '#');
    }

    sendEmail(email, config);
    logWithTime(`📧 Email sent to ${email} using template: ${templateName}`);
  } catch (error) {
    logWithTime(`❌ Error sending email: ${error.message}`);
  }
};

/**
 * 📱 Send SMS notification
 */
const sendSMSNotification = (phoneNumber, templateName, args = []) => {
  try {
    const templateFunction = smsTemplate[templateName];
    
    if (!templateFunction || typeof templateFunction !== 'function') {
      logWithTime(`⚠️ SMS template not found or invalid: ${templateName}`);
      return;
    }

    const message = templateFunction(...args);
    sendSMS(phoneNumber, message);
    logWithTime(`📱 SMS sent to ${phoneNumber} using template: ${templateName}`);
  } catch (error) {
    logWithTime(`❌ Error sending SMS: ${error.message}`);
  }
};

/**
 * 📤 Dispatch notification based on AuthMode (OLD APPROACH - KEPT FOR BACKWARD COMPATIBILITY)
 * @param {Object} options - Configuration object
 * @param {string} options.authMode - AuthMode (EMAIL, PHONE, BOTH, EITHER)
 * @param {string|null} options.email - Email address
 * @param {string|null} options.phone - Phone number
 * @param {Function} options.emailFunction - Email sending function (pre-configured with data)
 * @param {Function} options.smsFunction - SMS sending function (pre-configured with data)
 * @param {string} options.eventType - Event type for logging (e.g., "Admin Created")
 */
const dispatchNotification = ({
  authMode,
  email,
  phone,
  emailFunction,
  smsFunction,
  eventType = "Notification"
}) => {
  try {
    // Validate AuthMode
    const validAuthModes = Object.values(AuthModes);
    if (!validAuthModes.includes(authMode)) {
      logWithTime(`⚠️ Invalid AuthMode: ${authMode}. Skipping notification for ${eventType}`);
      return;
    }

    logWithTime(`📡 Dispatching ${eventType} notification - AuthMode: ${authMode}`);

    switch (authMode) {
      case AuthModes.EMAIL:
        // Only send email
        if (email && emailFunction) {
          logWithTime(`📧 Sending email notification for ${eventType}`);
          emailFunction();
        } else {
          logWithTime(`⚠️ Email required but not available for ${eventType}`);
        }
        break;

      case AuthModes.PHONE:
        // Only send SMS
        if (phone && smsFunction) {
          logWithTime(`📱 Sending SMS notification for ${eventType}`);
          smsFunction();
        } else {
          logWithTime(`⚠️ Phone required but not available for ${eventType}`);
        }
        break;

      case AuthModes.BOTH:
        // Send both email and SMS
        let sentCount = 0;
        
        if (email && emailFunction) {
          logWithTime(`📧 Sending email notification for ${eventType}`);
          emailFunction();
          sentCount++;
        } else {
          logWithTime(`⚠️ Email not available for ${eventType} (BOTH mode)`);
        }

        if (phone && smsFunction) {
          logWithTime(`📱 Sending SMS notification for ${eventType}`);
          smsFunction();
          sentCount++;
        } else {
          logWithTime(`⚠️ Phone not available for ${eventType} (BOTH mode)`);
        }

        if (sentCount === 0) {
          logWithTime(`❌ No notifications sent for ${eventType} - neither email nor phone available`);
        } else if (sentCount === 1) {
          logWithTime(`⚠️ Only one notification sent for ${eventType} (BOTH mode requires both)`);
        } else {
          logWithTime(`✅ Both notifications dispatched for ${eventType}`);
        }
        break;

      case AuthModes.EITHER:
        // Send whichever is available (email preferred)
        if (email && emailFunction) {
          logWithTime(`📧 Sending email notification for ${eventType} (EITHER mode - email preferred)`);
          emailFunction();
        } else if (phone && smsFunction) {
          logWithTime(`📱 Sending SMS notification for ${eventType} (EITHER mode - phone fallback)`);
          smsFunction();
        } else {
          logWithTime(`⚠️ No contact method available for ${eventType}`);
        }
        break;

      default:
        logWithTime(`⚠️ Unhandled AuthMode: ${authMode}. Skipping notification for ${eventType}`);
    }

  } catch (error) {
    logWithTime(`❌ Error dispatching notification for ${eventType}: ${error.message}`);
  }
};

/**
 * 🎯 Convenience wrapper for Admin notifications
 * @param {Object} admin - Admin object
 * @param {Function} emailFunction - Pre-configured email function
 * @param {Function} smsFunction - Pre-configured SMS function
 * @param {string} eventType - Event type for logging
 */
const notifyAdmin = (admin, emailFunction, smsFunction, eventType) => {
  if (!admin) {
    logWithTime(`⚠️ No admin found for ${eventType} notification`);
    return;
  }

  // AuthMode should come from environment, not from admin object
  const authMode = process.env.AUTH_MODE || AuthModes.BOTH;

  dispatchNotification({
    authMode,
    email: admin.email,
    phone: admin.fullPhoneNumber,
    emailFunction,
    smsFunction,
    eventType
  });
};

/**
 * 🎯 Convenience wrapper for User notifications
 * @param {Object} user - User object 
 * @param {Function} emailFunction - Pre-configured email function
 * @param {Function} smsFunction - Pre-configured SMS function
 * @param {string} eventType - Event type for logging
 */
const notifyUser = (user, emailFunction, smsFunction, eventType) => {
  if (!user) {
    logWithTime(`⚠️ No user found for ${eventType} notification`);
    return;
  }

  // AuthMode should come from environment, not from user object
  const authMode = process.env.AUTH_MODE || AuthModes.BOTH;

  dispatchNotification({
    authMode,
    email: user.email,
    phone: user.fullPhoneNumber,
    emailFunction,
    smsFunction,
    eventType
  });
};

module.exports = {
  dispatchNotification,
  notifyAdmin,
  notifyUser,
  sendNotificationFactory,
  sendEmailNotification,
  sendSMSNotification
};