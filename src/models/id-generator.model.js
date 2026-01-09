// Extracting the Required Modules for the working of this file
const mongoose = require("mongoose");

/* Making the Counter Collection in ecommerce_db, this Colection is Responsible for 
Unique ID Generation for Orders, Registration, Payments etc. */

// Defined Document Structure of a Counter (Act as Mongo DB ID Generator Service)
const counterSchema = mongoose.Schema({
    _id:{
        type: String,
        required: true,
    },
    seq:{
        type: Number,
        default: 0,
        required: true
    } 
},{versionKey: false});

// Defined Collection Counter in ecommerce_db Database
module.exports = mongoose.model("Counters",counterSchema)