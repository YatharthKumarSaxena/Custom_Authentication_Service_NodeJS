// Extracting Required Modules
const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Multiple Category sometimes can have same description that's why unique is true
    description: {
        type: String,
        required: true,
        trim: true 
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true
    },
    categoryID:{
        type: String,
        unique: true
    },
    imageURL: {
        type: String,
        default: null
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // For Search Engine Optimization
    metaTitle: {
        type: String,
        default: null
    },
    metaDescription: {
        type: String,
        default: null,
    },
    // For display order control
    priorityIndex: {
        type: Number,
        default: 1000 // Higher number = lower priority in sorting
    }
},{timestamps: true,versionKey: false});


categorySchema.index({ priorityIndex: 1 });

// Making Category Collections inside ecommerce_db Database
module.exports = mongoose.model("Category",categorySchema);