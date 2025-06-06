// This file will include the most common messages

/*
  ✅ DRY Principle: 
  This utility function is reused to print detailed error logs.
  Helps avoid repeating error console logic multiple times.
*/

exports.errorMessage = (err) => {
    console.log("Error occurred is given below:- ");
    console.log(err);
}

/*
  ✅ DRY Principle: 
  Generic error response logic abstracted here to avoid duplication across try/catch blocks.
*/

exports.throwErrorResponse = (res) => {
    res.status(500).send({ // Error 500 Indicate Internal Server Error
        message: "An error occurred in the Server while doing your registration\nSorry for this inconvenience, please try again"
    });
}