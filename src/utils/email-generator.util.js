const { logWithTime } = require("@utils/time-stamps.util");
const { defaultConfig, masterEmailTemplate } = require("@configs/email.config");

/**
 * Helper: Get color based on status
 */
const getStatusColor = (status) => {
    const { ui } = defaultConfig;
    
    if (ui.status_categories.success.includes(status)) {
        return ui.colors.success;
    }
    if (ui.status_categories.warning.includes(status)) {
        return ui.colors.warning;
    }
    if (ui.status_categories.danger.includes(status)) {
        return ui.colors.danger;
    }
    return ui.colors.primary;
};

/**
 * Generator Function (FIXED - OTP Priority)
 */
const generateEmailHtml = (templateConfig, data = {}) => {

    // 1. Validation
    if (!templateConfig) {
        logWithTime("ERROR", "Email Generator: No template configuration provided.");
        return null;
    }

    // 2. Dynamic Color & Badge
    const themeColor = getStatusColor(templateConfig.status);

    let badgeHtml = '';
    if (templateConfig.status && templateConfig.status !== 'Activated') {
        badgeHtml = `<span class="badge" style="background-color: ${themeColor}">${templateConfig.status}</span>`;
    }

    // 3. Inner Content Builder
    let innerContent = `
        <h3>Hi ${data.name || 'There'},</h3>
        <p>${templateConfig.message_intro}</p>
    `;

    // --- FIXED: OTP PRIORITY CHECK ---
    // PRIORITY 1: OTP (agar otp field hai)
    if (data.otp) {
        innerContent += `
            <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your Verification Code:</p>
                <div style="display: inline-block; padding: 15px 30px; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: ${themeColor}; background: #f8f9fa; border: 2px dashed ${themeColor}; border-radius: 8px;">
                    ${data.otp}
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">This code expires in 10 minutes.</p>
            </div>
        `;
    }
    // PRIORITY 2: LINK BUTTON (agar explicitly link diya gaya hai)
    else if (data.link) {
        innerContent += `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.link}" class="btn" style="background-color: ${themeColor}">${templateConfig.actionbutton_text || 'Click Here'}</a>
            </div>
        `;
    }
    // PRIORITY 3: TEMPLATE DEFAULT BUTTON (fallback - agar template mein define hai)
    else if (templateConfig.actionbutton_text && templateConfig.actionlink) {
        const baseUrl = process.env.FRONTEND_URL || "#";
        const finalLink = templateConfig.actionlink.replace("<LINK>", baseUrl);
        
        innerContent += `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${finalLink}" class="btn" style="background-color: ${themeColor}">${templateConfig.actionbutton_text}</a>
            </div>
        `;
    }

    // --- FALLBACK NOTE (Only for LINK mode) ---
    if (templateConfig.fallback_note && data.link && !data.otp) {
        let note = templateConfig.fallback_note.replace("{{link}}", data.link);
        if (data.frontendUrl) {
            note = note.replace("<LINK>", data.frontendUrl);
        }

        innerContent += `
            <div style="background: #f9f9f9; border-left: 4px solid ${themeColor}; padding: 10px 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; word-break: break-all;">${note}</p>
            </div>
        `;
    }

    // --- DYNAMIC NOTES ---
    if (templateConfig.notes) {
        let finalNotes = templateConfig.notes;
        
        // OTP-specific note
        if (data.otp) {
            finalNotes = "This verification code is valid for 10 minutes only.";
        }
        // Link-specific note
        else if (data.link) {
            finalNotes = "This verification link is valid for 10 minutes only.";
        }
        
        if (finalNotes) {
            innerContent += `<p style="color: #888; font-size: 12px; margin-top: 30px;"><em>${finalNotes}</em></p>`;
        }
    }

    // 4. Master Template Injection
    let finalHtml = masterEmailTemplate
        .replace("{{content}}", innerContent)
        .replace(/{{status_color}}/g, themeColor)
        .replace("{{badge_html}}", badgeHtml)
        .replace("{{button_color}}", themeColor)
        .replace("{{current_year}}", new Date().getFullYear())
        .replace("{{company_logo}}", defaultConfig.company_logo || "")
        .replace(/{{company_name}}/g, defaultConfig.company_name || "App")
        .replace("{{company_address}}", defaultConfig.company_address || "")
        .replace(/{{support_email}}/g, defaultConfig.support_email || "");

    // 5. Data Injection
    Object.keys(data).forEach(key => {
        const placeholder = `{{${key}}}`;
        finalHtml = finalHtml.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    return {
        subject: templateConfig.subject,
        html: finalHtml
    };
};

module.exports = { generateEmailHtml };