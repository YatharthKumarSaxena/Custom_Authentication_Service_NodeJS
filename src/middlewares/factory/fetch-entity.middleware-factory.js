const { 
  throwBadRequestError, 
  throwDBResourceNotFoundError, 
  throwInternalServerError, 
  logMiddlewareError,
  throwConflictError // User already exists ke liye
} = require("@/responses/common/error-handler.response");

/**
 * Factory middleware to fetch any entity
 * @param {Function} fetchFunction - (email, phone, userId) => Promise<Entity>
 * @param {string} entityName - e.g., "User"
 * @param {boolean} expectExists - TRUE (Login: User milna chahiye), FALSE (Register: User nahi milna chahiye)
 */
const fetchEntityFactory = (fetchFunction, entityName, expectExists = true) => {
  return async (req, res, next) => {
    try {
      const { email, phone, userId } = req.body;
      
      // Note: authMode validation already 'authModeValidator' middleware ne kar di hai.
      // Hum seedha values use kar sakte hain kyunki req.body clean hai.

      let finalEmail = null;
      let finalPhone = null;
      let finalUserId = null;

      // 1. Priority: userId (Direct fetch logic)
      if (userId) {
        if (email || phone) {
           // Ye check rakh sakte hain extra safety ke liye
           return throwBadRequestError(res, "Cannot send userId with identifiers");
        }
        finalUserId = userId;
      } 
      // 2. Priority: Email/Phone (Jo bhi req.body mein bacha hai use lelo)
      else {
        finalEmail = email || null;
        finalPhone = phone || null;
      }

      // 🔍 Fetch entity
      const foundEntity = await fetchFunction(finalEmail, finalPhone, finalUserId);
      
      // Handling: Login vs Registration Logic
      
      // CASE 1: Login Flow (expectExists = true)
      // User milna chahiye, agar nahi mila to Error 404
      if (expectExists && !foundEntity) {
        logMiddlewareError("fetchEntity", `${entityName} not found during lookup`, req);
        return throwDBResourceNotFoundError(res, entityName);
      }

      // CASE 2: Registration Flow (expectExists = false)
      // User NAHI milna chahiye, agar mil gaya to Error 409 (Conflict)
      if (!expectExists && foundEntity) {
        logMiddlewareError("fetchEntity", `${entityName} already exists`, req);
        return throwConflictError(res, `${entityName} already exists with provided credentials`);
      }

      // Attach to request
      req[`found${entityName}`] = foundEntity;

      return next();
      
    } catch (error) {
      logMiddlewareError("fetchEntity", `Internal error in fetch factory: ${error.message}`, req);
      return throwInternalServerError(res, error);
    }
  };
};

module.exports = { fetchEntityFactory };