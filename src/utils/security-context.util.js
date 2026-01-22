const getSecurityBucket = (user, context) => {
    if (!user.security) user.security = {};

    if (!user.security[context]) {
        user.security[context] = {
            failedAttempts: 0,
            lockoutUntil: null
        };
    }

    return user.security[context];
};

module.exports = {
    getSecurityBucket
};
