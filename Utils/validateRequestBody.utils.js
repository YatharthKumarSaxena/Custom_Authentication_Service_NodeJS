const validateSingleIdentifier = (req,res) => {
    const identifiers = [req.body.phoneNumber, req.body.emailID, req.body.userID].filter(Boolean);
    if (identifiers.length !== 1) {
        logWithTime("🧷 Invalid input: More than one or no identifier provided.");
        res.status(400).send({
            success: false,
            message: "❌ Provide exactly one identifier: userID, phoneNumber, or emailID."
        }) 
        return false;
    }
    logWithTime("🧩 Valid identifier input detected.");
    return true;
};

module.exports = {
  validateSingleIdentifier: validateSingleIdentifier
}
