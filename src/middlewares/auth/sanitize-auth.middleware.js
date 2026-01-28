const { sanitizeAuthPayload } = require("../factory/sanitize-auth-payload.middleware.factory");
const { RequestLocation } = require("@configs/enums.config");

const sanitizeAuthBody = sanitizeAuthPayload(RequestLocation.BODY);
const sanitizeAuthQuery = sanitizeAuthPayload(RequestLocation.QUERY);
const sanitizeAuthParams = sanitizeAuthPayload(RequestLocation.PARAMS);

module.exports = {
    sanitizeAuthBody,
    sanitizeAuthQuery,
    sanitizeAuthParams
};