/**
 * Email Template Testing Suite
 * Tests all email templates using sendEmail service
 */

require("module-alias/register");
require("dotenv").config();
const { sendEmail } = require("@services/mail.service");
const { generateEmailHtml } = require("@utils/email-generator.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { logWithTime } = require("@utils/time-stamps.util");

// Test user data
const testUser = {
    userId: "TEST_USER_001",
    email: process.env.TEST_EMAIL,
    phone: process.env.TEST_PHONE,
    firstName: "Test",
    userType: "CUSTOMER"
};

const testDevice = {
    deviceUUID: "test-device-uuid",
    deviceType: "LAPTOP",
    deviceName: "Test-Device"
};

// Test data for each template
const testData = {
    otp: "123456",
    token: "test-verification-token-xyz",
    new_email: "newemail@example.com",
    old_email: "oldemail@example.com"
};

/**
 * Test individual email template
 */
async function testEmailTemplate(templateName, additionalData = {}) {
    try {
        logWithTime(`\n🧪 Testing Email Template: ${templateName}`);
        logWithTime("================================================");
        
        // Get template configuration
        const template = userTemplate[templateName];
        
        if (!template) {
            logWithTime(`❌ ${templateName} - Template not found`);
            return;
        }

        // Prepare data for template
        const templateData = {
            name: testUser.firstName,
            ...testData,
            ...additionalData
        };

        // Generate email HTML
        const emailContent = generateEmailHtml(template, templateData);
        
        if (!emailContent) {
            logWithTime(`❌ ${templateName} - Failed to generate email content`);
            return;
        }

        // Send email (fire-and-forget)
        await sendEmail(testUser.email, emailContent.subject, emailContent.html);
        
        logWithTime(`✅ ${templateName} - Email queued for ${testUser.email}`);
        
    } catch (error) {
        logWithTime(`❌ ${templateName} - Error: ${error.message}`);
    }
}

/**
 * Run all email template tests
 */
async function runAllEmailTests() {
    logWithTime("\n" + "=".repeat(60));
    logWithTime("📧 EMAIL TEMPLATE TESTING STARTED");
    logWithTime("=".repeat(60));

    // 1. Registration & Verification
    logWithTime("\n📋 CATEGORY 1: REGISTRATION & VERIFICATION");
    await testEmailTemplate("verification");
    await testEmailTemplate("welcome_super_admin");
    await testEmailTemplate("welcome");

    // 2. Password & Security
    logWithTime("\n📋 CATEGORY 2: PASSWORD & SECURITY");
    await testEmailTemplate("forgotPassword");
    await testEmailTemplate("passwordChanged");
    await testEmailTemplate("newDeviceLogin", {
        browser: "Chrome 120.0",
        os: "Windows 10",
        ipAddress: "192.168.1.100",
        location: "Mumbai, India"
    });
    await testEmailTemplate("logoutAllDevices");

    // 3. Account Status
    logWithTime("\n📋 CATEGORY 3: ACCOUNT STATUS");
    await testEmailTemplate("accountDeactivated");
    await testEmailTemplate("accountReactivated");

    // 4. Profile Updates
    logWithTime("\n📋 CATEGORY 4: PROFILE UPDATES");
    await testEmailTemplate("verifyNewEmail");
    await testEmailTemplate("profileUpdated", {
        updatedFields: "Name, Address, Bio"
    });
    await testEmailTemplate("emailChangeAlert");

    // 5. Two-Factor Authentication
    logWithTime("\n📋 CATEGORY 5: TWO-FACTOR AUTHENTICATION");
    await testEmailTemplate("twoFactorLoginOTP");
    await testEmailTemplate("twoFactorEnabled");
    await testEmailTemplate("twoFactorDisabled");

    // 6. Device Verification
    logWithTime("\n📋 CATEGORY 6: DEVICE VERIFICATION");
    await testEmailTemplate("deviceVerification", {
        browser: "Firefox 119.0",
        os: "Ubuntu 22.04",
        ipAddress: "203.0.113.45",
        location: "Delhi, India"
    });

    logWithTime("\n" + "=".repeat(60));
    logWithTime("✅ ALL EMAIL TEMPLATE TESTS COMPLETED");
    logWithTime("=".repeat(60));
    logWithTime("\n📝 Note: Check your email inbox for all test emails");
    logWithTime("⚠️  Templates use fire-and-forget pattern - check logs for any errors");
}

/**
 * Test specific template by name
 */
async function testSingleTemplate(templateName) {
    logWithTime("\n" + "=".repeat(60));
    logWithTime(`🎯 TESTING SINGLE TEMPLATE: ${templateName}`);
    logWithTime("=".repeat(60));
    
    await testEmailTemplate(templateName);
    
    logWithTime("\n✅ Test completed - Check your email");
}

// Export for usage
module.exports = {
    runAllEmailTests,
    testSingleTemplate,
    testEmailTemplate
};

// Run all tests if executed directly
if (require.main === module) {
    runAllEmailTests()
        .then(() => {
            logWithTime("\n🎉 Email testing suite finished");
            process.exit(0);
        })
        .catch(error => {
            logWithTime(`\n❌ Testing failed: ${error.message}`);
            process.exit(1);
        });
}
