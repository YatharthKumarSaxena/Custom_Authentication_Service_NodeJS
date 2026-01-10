const extractAccessToken = (req) => {
    //🔐 Bearer Token Handling	✅ Added	Supports frontend standards, avoids malformed headers.
    const authHeader = req.headers["authorization"] || req.headers["x-access-token"]; // Check if the token is present in the Header
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    if(token)return token;
    return null;    // If token not found return null
}

const extractRefreshToken = (req) => {
    if(!req.cookies)return null;
    const refreshToken = req.cookies.refreshToken;
    if(refreshToken)return refreshToken;
    return null;
}

module.exports = {
    extractAccessToken: extractAccessToken,
    extractRefreshToken: extractRefreshToken
}