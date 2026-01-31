const mongoose = require("mongoose");
const { DB_COLLECTIONS } = require("@configs/db-collections.config");
const { ServiceNames } = require("@/configs/enums.config");

/**
 * Service Token Schema
 *
 * Stores metadata for service-to-service authentication tokens.
 * Raw tokens are NEVER stored — only hashed versions.
 */

const serviceTokenSchema = new mongoose.Schema(
{
    serviceName: {
        type: String,
        required: true,
        trim: true,
        enum: Object.values(ServiceNames)
    },

    serviceInstanceId: {
        type: String,
        required: true,
        trim: true
    },

    tokenHash: {
        type: String,
        required: true,
        unique: true
    },

    expiresAt: {
        type: Date,
        required: true
    },

    rotatedAt: {
        type: Date,
        default: Date.now
    },

    isActive: {
        type: Boolean,
        default: true
    },

    metadata: {
        generatedBy: {
            type: String,
            default: "system"
        },
        rotationCount: {
            type: Number,
            default: 0
        }
    }
},
{
    timestamps: true,
    collection: DB_COLLECTIONS.SERVICE_TOKENS || "service_tokens"
}
);

/* ------------------ Indexes ------------------ */

// only ONE active token allowed per service instance
serviceTokenSchema.index(
  { serviceInstanceId: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

/* ------------------ TTL Index ------------------ */

serviceTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 3600 }
);


/* ------------------ Static Methods ------------------ */

serviceTokenSchema.statics.findActiveByServiceInstance = function (
    serviceInstanceId
) {
    return this.findOne({
        serviceInstanceId,
        isActive: true,
        expiresAt: { $gt: new Date() }
    });
};

serviceTokenSchema.statics.deactivateOldTokens = function (
    serviceName,
    serviceInstanceId,
    excludeTokenHash
) {
    return this.updateMany(
        {
            serviceName,
            serviceInstanceId,
            tokenHash: { $ne: excludeTokenHash }
        },
        {
            $set: { isActive: false }
        }
    );
};

serviceTokenSchema.statics.cleanupExpiredTokens = function () {
    return this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

const ServiceToken = mongoose.model(
    DB_COLLECTIONS.SERVICE_TOKENS || "ServiceToken",
    serviceTokenSchema
);

module.exports = {
    ServiceToken
};
