const mongoose = require("mongoose");
const { SYSTEM_LOG_EVENTS, STATUS_TYPES, SERVICE_NAMES } = require("@configs/system-log-events.config");
const { DB_COLLECTIONS } = require("@configs/db-collections.config");

const systemLogSchema = new mongoose.Schema({
    // 1. Service Identity (Kisne kiya?)
    serviceName: { 
        type: String, 
        required: true, 
        enum: Object.values(SERVICE_NAMES) 
    },

    // 2. Event Type (Kaisa action tha?)
    eventType: { 
        type: String, 
        required: true, 
        enum:Object.values(SYSTEM_LOG_EVENTS)
    },

    // 3. Action Name (Specific kya hua?)
    action: { 
        type: String, 
        required: true 
    }, // e.g., "DEACTIVATE_EXPIRED_USERS"

    // 4. Target (Kiske upar action liya gaya? Optional)
    targetId: { 
        type: String, 
        default: null 
    }, // e.g., UserID jise deactivate kiya, ya OrderID

    // 5. Status & Message
    status: { 
        type: String, 
        enum: Object.values(STATUS_TYPES), 
        default: STATUS_TYPES.SUCCESS 
    },
    description: { 
        type: String ,
        required: true
    }, // "Deactivated user due to inactivity > 90 days"

    // 6. Metadata (Optional - Minimal info)
    metadata: { 
        type: Object, 
        default: {} 
    } // e.g., { processingTimeMs: 120 } -> No heavy payload
}, { 
    timestamps: true 
});

// Indexing for faster searching
systemLogSchema.index({ serviceName: 1, eventType: 1 });
systemLogSchema.index({ createdAt: -1 }); // Logs hamesha latest dekhne hote hain

module.exports = {
    SystemLogModel: mongoose.model(DB_COLLECTIONS.SYSTEM_LOG, systemLogSchema)
}