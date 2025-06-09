// This file will include the controller logic for all powers of Admin

// Extract the Required Modules
const { throwInvalidResourceError, throwInternalServerError, errorMessage } = require("../Configs/message.configs");
const { logWithTime } = require("../Configs/timeStampsFunctions.config");
const UserModel = require("../Models/User.model");

exports.blockUserAccount = async(req,res) => {
    try{
        const user = await UserModel.findOne({
            $or:[
                {userID: req.body.requestedUserID},
                {phoneNumber: req.body.phoneNumber},
                {emailID: req.body.emailID}
            ]
        })
        if(!user){
            logWithTime("Inavalid Details of User to be blocked is Provided");
            return throwInvalidResourceError(res,"UserID,Phone Number or EmailID (Any one of it)");
        }
        if(!user.isActive){
            return res.status(400).send({
                success: false,
                message: `User (${user.userID}) is already blocked.`
            });
        }
        // Block the user by setting isActive = false
        user.isActive = false;
        await user.save();
        logWithTime(`✅ User (${user.userID}) has been successfully blocked`);
        return res.status(200).send({
            success: true,
            message: `User (${user.userID}) has been successfully blocked.`
        });
    }catch(err){
        logWithTime("An Error occurrred while blocking the user account");
        errorMessage(err);
        return throwInternalServerError(err);
    }
}

exports.unblockUserAccount = async(req,res) => {
    try{
        const user = await UserModel.findOne({
            $or:[
                {userID: req.body.requestedUserID},
                {phoneNumber: req.body.phoneNumber},
                {emailID: req.body.emailID}
            ]
        })
        if(!user){
            logWithTime("Inavalid Details of User to be unblocked is Provided");
            return throwInvalidResourceError(res,"UserID,Phone Number or EmailID (Any one of it)");
        }
        if(user.isActive){
            return res.status(400).send({
                success: false,
                message: `User (${user.userID}) is already unblocked.`
            });
        }
        // Unblock the user by setting isActive = false
        user.isActive = true;
        await user.save();
        logWithTime(`✅ User (${user.userID}) has been successfully unblocked`);
        return res.status(200).send({
            success: true,
            message: `User (${user.userID}) has been successfully unblocked.`
        });
    }catch(err){
        logWithTime("An Error occurrred while unblocking the user account");
        errorMessage(err);
        return throwInternalServerError(err);
    }
}