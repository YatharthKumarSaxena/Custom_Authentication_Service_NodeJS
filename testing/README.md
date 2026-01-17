# 🧪 Notification Template Testing Suite

Complete testing framework for all email and SMS templates.

## 📁 Files

- `test-email-templates.js` - Test email templates using `sendEmail` from `mail.service`
- `test-sms-templates.js` - Test SMS templates using `sendSMS` from `sms.service`
- `test-all-templates.js` - Combined suite with `notification-dispatcher.util` for testing both

## 🎯 Testing Methods

### 1. Email Only Testing
Uses `sendEmail` from `src/services/mail.service.js`:
```bash
node testing/test-email-templates.js
```

### 2. SMS Only Testing
Uses `sendSMS` from `src/services/sms.service.js`:
```bash
node testing/test-sms-templates.js
```

### 3. Combined Testing (Email + SMS)
Uses `sendNotification` from `src/utils/notification-dispatcher.util.js`:
```bash
# Test both email and SMS together
node testing/test-all-templates.js --combined verification
node testing/test-all-templates.js --combined welcome
```

## 🚀 Usage

### Test Everything
```bash
# Run all email + SMS tests
node testing/test-all-templates.js
```

### Test Email Templates Only
```bash
# All email templates
node testing/test-email-templates.js

# Specific email template
node testing/test-all-templates.js verification
```

### Test SMS Templates Only
```bash
# All SMS templates
node testing/test-sms-templates.js

# Specific SMS template
node testing/test-all-templates.js passwordChanged
```

### Test by Category
```bash
# Test all security-related templates
node testing/test-all-templates.js --category security

# Test all 2FA templates
node testing/test-all-templates.js --category twoFactor

# Test all profile update templates
node testing/test-all-templates.js --category profile
```

### Help Menu
```bash
node testing/test-all-templates.js --help
```

## 🔧 How It Works

### Email Testing (`test-email-templates.js`)
1. Imports `sendEmail` from `@services/mail.service`
2. Imports `generateEmailHtml` from `@utils/email-generator.util`
3. Imports email templates from `@services/templates/emailTemplate`
4. Generates HTML using template + data
5. Sends email using `sendEmail(email, subject, html)`
6. Fire-and-forget pattern (no await)

### SMS Testing (`test-sms-templates.js`)
1. Imports `sendSMS` from `@services/sms.service`
2. Imports `generateSmsMessage` from `@utils/sms-generator.util`
3. Imports SMS templates from `@services/templates/smsTemplate`
4. Generates message using template + OTP
5. Sends SMS using `sendSMS(phone, message)`
6. Fire-and-forget pattern (no await)

### Combined Testing (`test-all-templates.js --combined`)
1. Imports `sendNotification` from `@utils/notification-dispatcher.util`
2. Imports both email and SMS templates
3. Prepares `contactInfo` with email, phone, and `ContactModes.BOTH`
4. Calls `sendNotification({ contactInfo, emailTemplate, smsTemplate, data })`
5. Dispatcher handles both email and SMS sending internally

## 📋 Available Categories

| Category | Templates Included |
|----------|-------------------|
| **verification** | verification, welcome_super_admin, welcome |
| **security** | forgotPassword, passwordChanged, newDeviceLogin, logoutAllDevices |
| **account** | accountDeactivated, accountReactivated |
| **profile** | verifyNewEmail, verifyNewPhone, profileUpdated, emailChangeAlert, phoneChangeAlert |
| **twoFactor** | twoFactorLoginOTP, twoFactorEnabled, twoFactorDisabled |
| **device** | deviceVerification |

## 📧 Email Templates Tested

### Registration & Verification
- ✅ `verification` - Email verification OTP/link
- ✅ `welcome_super_admin` - Super admin welcome email
- ✅ `welcome` - Welcome email after verification

### Password & Security
- ✅ `forgotPassword` - Password reset request
- ✅ `passwordChanged` - Password change confirmation
- ✅ `newDeviceLogin` - New device login alert
- ✅ `logoutAllDevices` - Logout all devices confirmation

### Account Status
- ✅ `accountDeactivated` - Account deactivation notice
- ✅ `accountReactivated` - Account reactivation welcome

### Profile Updates
- ✅ `verifyNewEmail` - New email verification
- ✅ `profileUpdated` - Profile update confirmation
- ✅ `emailChangeAlert` - Email change security alert

### Two-Factor Authentication
- ✅ `twoFactorLoginOTP` - 2FA login OTP
- ✅ `twoFactorEnabled` - 2FA enabled confirmation
- ✅ `twoFactorDisabled` - 2FA disabled alert

### Device Verification
- ✅ `deviceVerification` - New device authorization

## 📱 SMS Templates Tested

All above templates also have SMS versions with:
- Concise message format (160 chars max)
- OTP placeholder support
- DLT template IDs (for India)

## ⚙️ Configuration

### Required Environment Variables
```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# SMS Configuration
SMS_MODE=mock  # or termux-ssh or real
SMS_ENABLED=true
TEST_PHONE_NUMBER=+919876543210

# App URLs
FRONTEND_URL=http://localhost:3030
COMPANY_NAME="Your App Name"
```

### Test User Data
The test suite uses mock user data:
```javascript
{
    userId: "TEST_USER_001",
    email: "test@example.com",
    phone: "+919876543210",
    firstName: "Test",
    userType: "CUSTOMER"
}
```

## 🔍 What Gets Tested

Each test:
1. ✅ Creates notification data with template name
2. ✅ Calls `sendNotification()` with fire-and-forget pattern
3. ✅ Logs success/failure to console
4. ✅ Validates template exists and data is passed correctly

## 📊 Test Output Example

```
============================================================
📧 EMAIL TEMPLATE TESTING STARTED
============================================================

📋 CATEGORY 1: REGISTRATION & VERIFICATION

🧪 Testing Email Template: verification
================================================
✅ verification - Email sent successfully

🧪 Testing Email Template: welcome
================================================
✅ welcome - Email sent successfully

============================================================
✅ ALL EMAIL TEMPLATE TESTS COMPLETED
============================================================

📝 Note: Check your email inbox for all test emails
⚠️  Templates use fire-and-forget pattern - check logs for any errors
```

## 🐛 Debugging

### Check Email Delivery
- Monitor your inbox at configured email
- Check spam/junk folder
- Review SMTP logs in console

### Check SMS Delivery
- If `SMS_MODE=mock`, check console logs
- If `SMS_MODE=termux-ssh`, check Termux device
- Review SMS service logs

### Common Issues
1. **No emails received**: Check SMTP credentials and Gmail App Password
2. **SMS not sent**: Verify SMS_MODE and phone number format
3. **Template not found**: Check template name spelling
4. **Fire-and-forget errors**: Check console logs for async errors

## 💡 Tips

1. **Run tests in development only** - Don't spam production users
2. **Use mock SMS mode** for local testing
3. **Check logs** - Fire-and-forget pattern means errors logged, not thrown
4. **Test incrementally** - Use single template tests during development
5. **Verify all templates** before deployment

## 🎯 Integration with CI/CD

Add to package.json:
```json
{
  "scripts": {
    "test:templates": "node testing/test-all-templates.js",
    "test:email": "node testing/test-email-templates.js",
    "test:sms": "node testing/test-sms-templates.js"
  }
}
```

Run with npm:
```bash
npm run test:templates
npm run test:email
npm run test:sms
```

## ✅ Checklist

Before deployment:
- [ ] All email templates tested
- [ ] All SMS templates tested
- [ ] Email received successfully
- [ ] SMS received successfully (if enabled)
- [ ] No console errors
- [ ] Templates render correctly
- [ ] Links work properly
- [ ] OTPs displayed correctly
- [ ] Branding appears correctly
- [ ] Fire-and-forget pattern working

## 📞 Support

If you encounter issues:
1. Check environment variables
2. Verify SMTP/SMS configuration
3. Review console logs
4. Test individual templates
5. Check notification.factory.js implementation
