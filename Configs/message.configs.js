// This file will include the most common messages

/*
  ✅ DRY Principle: 
  This utility function is reused to print detailed error logs.
  Helps avoid repeating error console logic multiple times.
*/

exports.errorMessage = (err) => {
    console.log("🛑 Error occurred:");
    console.error(err);
    return;
}

/*
  ✅ SRP + DRY: 
  Handles cases where required fields are missing in the request.
*/

exports.throwResourceNotFoundError = (res,resource) =>{
    console.log("⚠️ Missing required fields in the request:");
    console.log(resource);
    return res.status(400).send({
        warning: "The following required field(s) are missing:",
        fields: resource,
        message: "Please provide the required fields to proceed."
    });
}

/*
  ✅ SRP: 
  Handles all internal server failure responses.
*/

exports.throwInternalServerError = (res) =>{
    console.log("💥 Internal Server Error occurred.");
    return res.status(500).send({
        response: "An internal server error occurred while processing your request.",
        message: "We apologize for the inconvenience. Please try again later."
    });
}