const { masterEmailTemplate, defaultConfig } = require("../../configs/email.config");
const { logWithTime } = require("./time-stamps.util");

/**
 * Helper: Find Color based on Status
 */
const getStatusColor = (status) => {
    if (!defaultConfig?.ui) return '#007bff'; // Safety Access
    const { colors, status_categories } = defaultConfig.ui;
    
    if (status_categories.success.includes(status)) return colors.success;
    if (status_categories.warning.includes(status)) return colors.warning;
    if (status_categories.danger.includes(status)) return colors.danger;
    
    return colors.primary;
};

/**
 * 📧 Generator Function
 */
const generateEmailHtml = (templateConfig, data = {}) => {
    
    // 1. Validation
    if (!templateConfig) {
        logWithTime("ERROR", "Email Generator: No template configuration provided.");
        return null;
    }

    // 2. Dynamic Color
    const themeColor = getStatusColor(templateConfig.status);
    
    let badgeHtml = '';
    if (templateConfig.status && templateConfig.status !== 'Activated') {
        badgeHtml = `<span class="badge" style="background-color: ${themeColor}">${templateConfig.status}</span>`;
    }

    // 3. Inner Content
    let innerContent = `
        <h3>Hi ${data.name || 'There'},</h3>
        <p>${templateConfig.message_intro}</p>
    `;

    if (templateConfig.actionbutton_text && templateConfig.actionlink) {
        const link = templateConfig.actionlink.replace("<LINK>", process.env.FRONTEND_URL || "#");
        innerContent += `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" class="btn" style="background-color: ${themeColor}">${templateConfig.actionbutton_text}</a>
            </div>
        `;
    }

    if (templateConfig.fallback_note) {
        innerContent += `
            <div style="background: #f9f9f9; border-left: 4px solid ${themeColor}; padding: 10px 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;">${templateConfig.fallback_note}</p>
            </div>
        `;
    }

    if (templateConfig.notes) {
        innerContent += `<p style="color: #888; font-size: 12px; margin-top: 30px;"><em>${templateConfig.notes}</em></p>`;
    }

    // 4. Master Template Injection
    let finalHtml = masterEmailTemplate
        .replace("{{content}}", innerContent)
        .replace(/{{status_color}}/g, themeColor)
        .replace("{{badge_html}}", badgeHtml)
        .replace("{{button_color}}", themeColor)
        .replace("{{current_year}}", new Date().getFullYear())
        
        // Branding Replacements
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