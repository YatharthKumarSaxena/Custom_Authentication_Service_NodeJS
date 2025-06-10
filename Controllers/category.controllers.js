const CategoryModel = require("../Models/Category.model");
const CounterModel = require("../Models/ID_Generator.model");
const messageModel = require("../Configs/message.configs");

const categoryIDPrefix = require("../Configs/idPrefixes.config").category;
const IP_Address_Code = require("../Configs/ipAddress.config").IP_Address_Code;
const logWithTime = require("../Configs/timeStampsFunctions.config").logWithTime;
const errorMessage = messageModel.errorMessage;
const throwInternalServerError = messageModel.throwInternalServerError;

// Creates a Category Counter with seq: 0 initially
async function createCategoryCounter(){
    try{
        const categoryCounter = CounterModel.create({
            _id: categoryIDPrefix,
            seq: 0
// totalCategories is by default 0 taken so not need to reassign same value
        })
        return categoryCounter;
    }catch(err){
        logWithTime("⚠️ An Error occurred while creating the Category Counter");
        errorMessage(err);
        return;
    }
}

// Increases the value of seq field in Category Counter Document to generate unique ID for new Categories
async function increaseCategoryCounter(){
    try{
        const categoryCounter = await CounterModel.findOneAndUpdate(
            { _id: "CUS" },
            { $inc: { seq: 1 } },
            { new: true } // This will force Mongo DB to return updated document
            // By Default MongoDB returns old documents even after updation
        );
        return categoryCounter.seq;
    }catch(err){
        logWithTime("🛑 An Error Occured in findOneAndUpdate function applied on Category Counter Document")
        errorMessage(err);
        return;
    }
}

// Make Category ID
async function makeCategoryID(){
    let totalCategories = 0;
    let categoryCounter;
    try{
        categoryCounter = await CounterModel.findOne({_id: "CAT"});
    }catch(err){
        logWithTime("⚠️ An Error Occured while accessing the Counter Model Document");
        errorMessage(err);
        return;
    }
    if(categoryCounter){ // Means Customer Counter Exist so Just increase Counter
        totalCategories = await increaseCategoryCounter();
    }
    else{ // Means Customer Counter does not exist 
        categoryCounter = await createCategoryCounter(); // returns object
        totalCategories = categoryCounter.seq; // extract 'seq' field 
    }
    return totalCategories;
}

exports.createCategory = async (req,res) => {
    try{
        const name = req.name;
        const description = req.description;
        const slug = req.slug;
        const generatedCategoryID = await makeCategoryID();
        let newID = String(generatedCategoryID);
        let machineCode = categoryIDPrefix + IP_Address_Code;
        const categoryID = machineCode + newID;
        const category = await CategoryModel.create({
            name: name,
            description: description,
            slug: slug,
            categoryID: categoryID
        })
        logWithTime("🟢 Category Created Successfully");
        logWithTime("👤 New Category Details:- ");
        const categoryGeneralDetails = {
            name: category.name,
            categoryID: category.categoryID,
            description: category.description,
            slug: category.slug,
            createdAt: category.createdAt
        }
        console.log(categoryGeneralDetails);
        return res.status(201).send({
            message: "New Category is created Successfully",
            details:"Here is your New Basic Category Details given below:-", 
            name: category.name,
            categoryID: category.categoryID,
            description: category.description,
            createdAt: category.createdAt
        })
    }catch(err){
        logWithTime("Error Occured while creating a new Category");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}