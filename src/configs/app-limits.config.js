const { getMyEnvAsNumber } = require("@/utils/env.util");

module.exports = {
  userRegistrationCapacity: getMyEnvAsNumber("USER_REGISTRATION_CAPACITY")
};
