const { logWithTime } = require("@/utils/time-stamps.util");
const { FirstNameFieldSetting } = require("@configs/enums.config");
const { FIRST_NAME_SETTING } = require("@configs/security.config");
const { logMiddlewareError, throwInternalServerError, throwAccessDeniedError, throwMissingFieldsError, throwInvalidResourceError } = require("@/responses/common/error-handler.response");
const { firstNameRegex } = require("@configs/regex.config");
const { firstNameLength } = require("@configs/fields-length.config");
const { isValidRegex, validateLength } = require("@utils/validators-factory.util");

const firstNameValidator = (req, res, next) => {
    try {
        let firstName = req.body.firstName;

        firstName = (firstName && typeof firstName === 'string') ? firstName.trim() : firstName;

        if (FIRST_NAME_SETTING === FirstNameFieldSetting.MANDATORY) {
            if (!firstName) {
                logMiddlewareError("firstNameValidator", "First name is mandatory but missing", req);
                return throwMissingFieldsError(res, "First name");
            }
        } else if (FIRST_NAME_SETTING === FirstNameFieldSetting.DISABLED) {
            if (firstName) {
                logMiddlewareError("firstNameValidator", "First name field is disabled but provided", req);
                return throwAccessDeniedError(res, "First name field is disabled and should not be provided");
            }
        }

        if (firstName) {
            if (!validateLength(firstName, firstNameLength.min, firstNameLength.max)) {
                logMiddlewareError("firstNameValidator", "First name length validation failed", req);
                return throwInvalidResourceError(res, `First name must be between ${firstNameLength.min} and ${firstNameLength.max} characters long`);
            }

            if (!isValidRegex(firstName, firstNameRegex)) {
                logMiddlewareError("firstNameValidator", "First name regex validation failed", req);
                return throwInvalidResourceError(res, "First name contains invalid characters");
            }
        }

        req.body.firstName = firstName; // Normalize firstName

        logWithTime("✅ First name validation passed");

        return next();
    } catch (err) {
        logMiddlewareError("firstNameValidator", "Error during first name validation", req);
        return throwInternalServerError(res, err);
    }

};

module.exports = {
    firstNameValidator
};