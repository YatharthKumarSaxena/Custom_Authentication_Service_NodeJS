// utils/url.helper.js

const getFrontendUrl = (path, queryParams = {}) => {
    // Default to localhost if env is missing
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    
    // URL construct karo
    const url = new URL(path, baseUrl);
    
    // Params add karo (jaise ?token=xyz)
    Object.keys(queryParams).forEach(key => {
        url.searchParams.append(key, queryParams[key]);
    });

    return url.toString();
};

module.exports = { getFrontendUrl }; 