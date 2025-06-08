// This file will include the most common messages

/*
  ✅ DRY Principle: 
  This utility function is reused to print detailed error logs.
  Helps avoid repeating error console logic multiple times.
*/

// Extracts file that include timeStamp function
const commonFeatures = require("./commonFeatures.config");

exports.errorMessage = (err) => {
    console.log("Time at which Error Occured: ",commonFeatures.getTimeStamp());
    console.log("🛑 Error occurred:");
    console.log("File Name and Line Number where this error ccured is displayed below:- ");
    console.log(err.stack)
    console.log("Error Message is displayed below:- ")
    console.error(err.message);
    return;
}

/*
  ✅ SRP + DRY: 
  Handles cases where required fields are missing in the request.
*/

exports.throwResourceNotFoundError = (res,resource) =>{
    console.log("Time at which Error Occured: ",timeStamp.getTimeStamp());
    console.log("⚠️ Missing required fields in the request:");
    console.log(resource);
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
    console.log("Time at which Error Occured: ",timeStamp.getTimeStamp());
    console.log("💥 Internal Server Error occurred.");
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
    console.log("Time at which Error Occured: ",timeStamp.getTimeStamp());
    console.log("❌ Invalid Credentials! Please try again.");
    return res.status(401).send({
        type: "InvalidResource",
        resource: resource,
        warning: "Invalid "+ resource + "Entered",
        message: "Please enter a Valid "+ resource
    })
}