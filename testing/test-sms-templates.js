/**
 * SMS Template Testing Suite
 * Tests all SMS templates using sendSMS service
 */

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

require("module-alias/register");
require("dotenv").config();
const { sendSMS } = require("@services/sms.service");
const { generateSmsMessage } = require("@utils/sms-generator.util");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { logWithTime } = require("@utils/time-stamps.util");

// Test user data
const testUser = {
    userId: "TEST_USER_002",
    phone: process.env.TEST_PHONE || "",
    countryCode: "91",
    localNumber: process.env.TEST_PHONE || "",
    firstName: "Test",
    userType: "CUSTOMER"
};

// Test data for SMS templates
const testData = {
    otp: "654321"
};

/**
 * Test individual SMS template
 */
async function testSMSTemplate(templateName, additionalData = {}) {
    try {
        logWithTime(`\n🧪 Testing SMS Template: ${templateName}`);
        logWithTime("================================================");
        
        // Get template configuration
        const template = userSmsTemplate[templateName];
        
        if (!template) {
            logWithTime(`❌ ${templateName} - Template not found`);
            return;
        }

        // Prepare data for template (primarily OTP)
        const otp = testData.otp;

        // Generate SMS message
        const smsMessage = generateSmsMessage(template, otp);
        
        if (!smsMessage) {
            logWithTime(`❌ ${templateName} - Failed to generate SMS message`);
            return;
        }

        // Send SMS (fire-and-forget)
        sendSMS(testUser.phone, smsMessage);
        
        await wait(4000);
        
        logWithTime(`✅ ${templateName} - SMS queued for ${testUser.phone}`);
        logWithTime(`   Message: ${smsMessage.substring(0, 50)}...`);
        
    } catch (error) {
        logWithTime(`❌ ${templateName} - Error: ${error.message}`);
    }
}

/**
 * Run all SMS template tests
 */
async function runAllSMSTests() {
    logWithTime("\n" + "=".repeat(60));
    logWithTime("📱 SMS TEMPLATE TESTING STARTED");
    logWithTime("=".repeat(60));

    // 1. Registration & Verification
    logWithTime("\n📋 CATEGORY 1: REGISTRATION & VERIFICATION");
    await testSMSTemplate("verification");
    await testSMSTemplate("welcome_super_admin");
    await testSMSTemplate("welcome");

    // 2. Password & Security
    logWithTime("\n📋 CATEGORY 2: PASSWORD & SECURITY");
    await testSMSTemplate("forgotPassword");
    await testSMSTemplate("passwordChanged");
    await testSMSTemplate("newDeviceLogin");
    await testSMSTemplate("logoutAllDevices");

    // 3. Account Status
    logWithTime("\n📋 CATEGORY 3: ACCOUNT STATUS");
    await testSMSTemplate("accountDeactivated");
    await testSMSTemplate("accountReactivated");

    // 4. Profile & Phone Updates
    logWithTime("\n📋 CATEGORY 4: PROFILE & PHONE UPDATES");
    await testSMSTemplate("verifyNewPhone");
    await testSMSTemplate("profileUpdated");
    await testSMSTemplate("phoneChangeAlert");

    // 5. Two-Factor Authentication
    logWithTime("\n📋 CATEGORY 5: TWO-FACTOR AUTHENTICATION");
    await testSMSTemplate("twoFactorLoginOTP");
    await testSMSTemplate("twoFactorEnabled");
    await testSMSTemplate("twoFactorDisabled");

    // 6. Device Verification
    logWithTime("\n📋 CATEGORY 6: DEVICE VERIFICATION");
    await testSMSTemplate("deviceVerification");

    logWithTime("\n" + "=".repeat(60));
    logWithTime("✅ ALL SMS TEMPLATE TESTS COMPLETED");
    logWithTime("=".repeat(60));
    logWithTime("\n📝 Note: Check your phone or SMS console for messages");
    logWithTime(`📱 Test phone number: ${testUser.phone}`);
    logWithTime(`⚙️  SMS Mode: ${process.env.SMS_MODE || 'mock'}`);
    logWithTime("⚠️  Templates use fire-and-forget pattern - check logs for any errors");
}

/**
 * Test specific SMS template by name
 */
async function testSingleSMSTemplate(templateName) {
    logWithTime("\n" + "=".repeat(60));
    logWithTime(`🎯 TESTING SINGLE SMS TEMPLATE: ${templateName}`);
    logWithTime("=".repeat(60));
    
    await testSMSTemplate(templateName);
    
    logWithTime("\n✅ Test completed - Check your phone/SMS console");
}

// Export for usage
module.exports = {
    runAllSMSTests,
    testSingleSMSTemplate,
    testSMSTemplate
};

// Run all tests if executed directly
if (require.main === module) {
    runAllSMSTests()
        .then(() => {
            logWithTime("\n🎉 SMS testing suite finished");
            process.exit(0);
        })
        .catch(error => {
            logWithTime(`\n❌ Testing failed: ${error.message}`);
            process.exit(1);
        });
}
