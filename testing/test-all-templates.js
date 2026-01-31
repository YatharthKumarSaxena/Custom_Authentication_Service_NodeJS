/**
 * Complete Notification Testing Suite
 * Tests both Email and SMS templates using notification-dispatcher
 */

require("module-alias/register");
require("dotenv").config();
const { logWithTime } = require("@utils/time-stamps.util");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { ContactModes } = require("@configs/enums.config");

// Import test suites
const { runAllEmailTests, testSingleTemplate: testEmail } = require("./test-email-templates");
const { runAllSMSTests, testSingleSMSTemplate: testSMS } = require("./test-sms-templates");

/**
 * Run all notification tests (Email + SMS)
 */
async function runAllTests() {
    logWithTime("\n" + "=".repeat(70));
    logWithTime("🚀 COMPLETE NOTIFICATION TESTING SUITE");
    logWithTime("=".repeat(70));
    logWithTime(`\n📅 Test Started At: ${new Date().toLocaleString()}`);
    logWithTime(`📧 Email Config: ${process.env.SMTP_USER || 'Not configured'}`);
    logWithTime(`📱 SMS Mode: ${process.env.SMS_MODE || 'mock'}`);
    logWithTime(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

    try {
        // Test all email templates
        await runAllEmailTests();
        
        // Small delay between email and SMS tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test all SMS templates
        await runAllSMSTests();

        logWithTime("\n" + "=".repeat(70));
        logWithTime("🎉 ALL TESTS COMPLETED SUCCESSFULLY");
        logWithTime("=".repeat(70));
        logWithTime("\n📝 Summary:");
        logWithTime("   - All email templates tested ✅");
        logWithTime("   - All SMS templates tested ✅");
        logWithTime("   - Check your inbox and phone for notifications");
        logWithTime("\n💡 Tip: Monitor server logs for any delivery errors");

    } catch (error) {
        logWithTime("\n❌ Test Suite Failed:");
        logWithTime(`   Error: ${error.message}`);
        throw error;
    }
}

/**
 * Test specific template (auto-detect email or SMS)
 */
async function testTemplate(templateName, type = "auto") {
    logWithTime("\n" + "=".repeat(60));
    logWithTime(`🎯 TESTING TEMPLATE: ${templateName}`);
    logWithTime("=".repeat(60));

    if (type === "email" || type === "auto") {
        await testEmail(templateName);
    }

    if (type === "sms" || type === "auto") {
        await testSMS(templateName);
    }

    logWithTime("\n✅ Template test completed");
}

/**
 * Test template using notification-dispatcher (Email + SMS combined)
 */
async function testCombinedNotification(templateName) {
    try {
        logWithTime("\n" + "=".repeat(60));
        logWithTime(`🎯 TESTING COMBINED NOTIFICATION: ${templateName}`);
        logWithTime("=".repeat(60));

        const emailTemplate = userTemplate[templateName];
        const smsTemplate = userSmsTemplate[templateName];

        if (!emailTemplate && !smsTemplate) {
            logWithTime(`❌ Template ${templateName} not found in email or SMS`);
            return;
        }

        const contactInfo = {
            email: process.env.TEST_EMAIL || "",
            phone: process.env.TEST_PHONE || "",
            contactMode: ContactModes.BOTH
        };

        const data = {
            name: "Test User",
            otp: "123456",
            token: "test-token-xyz"
        };

        // Use notification-dispatcher for combined sending
        await sendNotification({
            contactInfo,
            emailTemplate,
            smsTemplate,
            data
        });

        logWithTime(`✅ ${templateName} - Combined notification sent`);
        logWithTime(`   📧 Email: ${contactInfo.email}`);
        logWithTime(`   📱 SMS: ${contactInfo.phone}`);

    } catch (error) {
        logWithTime(`❌ ${templateName} - Error: ${error.message}`);
    }
}

/**
 * Test templates by category
 */
async function testByCategory(category) {
    const categories = {
        verification: ["verification", "welcome_super_admin", "welcome"],
        security: ["forgotPassword", "passwordChanged", "newDeviceLogin", "logoutAllDevices"],
        account: ["accountDeactivated", "accountReactivated"],
        profile: ["verifyNewEmail", "verifyNewPhone", "profileUpdated", "emailChangeAlert", "phoneChangeAlert"],
        twoFactor: ["twoFactorLoginOTP", "twoFactorEnabled", "twoFactorDisabled"],
        device: ["deviceVerification"]
    };

    const templates = categories[category];
    
    if (!templates) {
        logWithTime(`❌ Invalid category: ${category}`);
        logWithTime(`Available categories: ${Object.keys(categories).join(", ")}`);
        return;
    }

    logWithTime(`\n🧪 Testing Category: ${category.toUpperCase()}`);
    logWithTime("=".repeat(60));

    for (const template of templates) {
        await testTemplate(template);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logWithTime(`\n✅ Category ${category} testing completed`);
}

/**
 * Interactive menu for testing
 */
function showMenu() {
    console.log("\n" + "=".repeat(70));
    console.log("📋 NOTIFICATION TESTING MENU");
    console.log("=".repeat(70));
    console.log("\nUsage Examples:");
    console.log("  node testing/test-all-templates.js                    # Run all tests");
    console.log("  node testing/test-all-templates.js verification       # Test specific template");
    console.log("  node testing/test-all-templates.js --category security # Test category");
    console.log("  node testing/test-all-templates.js --combined welcome  # Test email+SMS together");
    console.log("  node testing/test-email-templates.js                  # Email tests only");
    console.log("  node testing/test-sms-templates.js                    # SMS tests only");
    console.log("\nTesting Methods:");
    console.log("  📧 Email Only   : Uses sendEmail from mail.service");
    console.log("  📱 SMS Only     : Uses sendSMS from sms.service");
    console.log("  📧+📱 Combined  : Uses notification-dispatcher.util (--combined flag)");
    console.log("\nAvailable Categories:");
    console.log("  - verification  : Registration & verification templates");
    console.log("  - security      : Password & security templates");
    console.log("  - account       : Account status templates");
    console.log("  - profile       : Profile update templates");
    console.log("  - twoFactor     : 2FA templates");
    console.log("  - device        : Device verification templates");
    console.log("\nAvailable Templates:");
    console.log("  verification, welcome_super_admin, welcome, forgotPassword,");
    console.log("  passwordChanged, newDeviceLogin, logoutAllDevices,");
    console.log("  accountDeactivated, accountReactivated, verifyNewEmail,");
    console.log("  verifyNewPhone, profileUpdated, emailChangeAlert,");
    console.log("  phoneChangeAlert, twoFactorLoginOTP, twoFactorEnabled,");
    console.log("  twoFactorDisabled, deviceVerification");
    console.log("=".repeat(70) + "\n");
}

// Export functions
module.exports = {
    runAllTests,
    testTemplate,
    testCombinedNotification,
    testByCategory,
    showMenu
};

// Command line execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // No arguments - run all tests
        runAllTests()
            .then(() => process.exit(0))
            .catch(error => {
                logWithTime(`\n❌ Error: ${error.message}`);
                process.exit(1);
            });
    } else if (args[0] === "--help" || args[0] === "-h") {
        showMenu();
        process.exit(0);
    } else if (args[0] === "--category" && args[1]) {
        // Test by category
        testByCategory(args[1])
            .then(() => process.exit(0))
            .catch(error => {
                logWithTime(`\n❌ Error: ${error.message}`);
                process.exit(1);
            });
    } else if (args[0] === "--combined" && args[1]) {
        // Test using combined notification-dispatcher
        testCombinedNotification(args[1])
            .then(() => process.exit(0))
            .catch(error => {
                logWithTime(`\n❌ Error: ${error.message}`);
                process.exit(1);
            });
    } else {
        // Test specific template
        testTemplate(args[0])
            .then(() => process.exit(0))
            .catch(error => {
                logWithTime(`\n❌ Error: ${error.message}`);
                process.exit(1);
            });
    }
}
