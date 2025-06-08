// This file will include the most common messages

/*
  ✅ DRY Principle: 
  This utility function is reused to print detailed error logs.
  Helps avoid repeating error console logic multiple times.
*/

// Extracts file that include timeStamp function
const commonFeatures = require("./commonFeatures.config");
const logWithTime = commonFeatures.logWithTime;

exports.errorMessage = (err) => {
    logWithTime("🛑 Error occurred:");
    logWithTime("File Name and Line Number where this error ccured is displayed below:- ");
    console.log(err.stack)
    logWithTime("Error Message is displayed below:- ")
    console.error(err.message);
    return;
}

/*
  ✅ SRP + DRY: 
  Handles cases where required fields are missing in the request.
*/

exports.throwResourceNotFoundError = (res,resource) =>{
    logWithTime("⚠️ Missing required fields in the request:");
    logWithTime(resource);
    return res.status(400).send({
        warning: "The following required field(s) are missing:",
        fields: resource,
        message: "Please provide the required fields to proceed."
    });
}

/*
  ✅ SRP + DRY: 
  Handles all internal server failure responses.
*/

exports.throwInternalServerError = (res) => {
    logWithTime("💥 Internal Server Error occurred.");
    return res.status(500).send({
        response: "An internal server error occurred while processing your request.",
        message: "We apologize for the inconvenience. Please try again later."
    });
}

/*
  ✅ SRP + DRY: 
  Handles all credentials failure responses.
*/

exports.throwInvalidResourceError = (res,resource) => {
    logWithTime("❌ Invalid Credentials! Please try again.");
    return res.status(401).send({
        type: "InvalidResource",
        resource: resource,
        warning: "Invalid "+ resource + "Entered",
        message: "Please enter a Valid "+ resource
    })
}