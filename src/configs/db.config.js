// Since location where we want to store data can change
// Hence DB_URL can change , hence it is a configurable value and placed in Configs Folder 

const { getMyEnv } = require("@/utils/env.util");

// Note:- For Windows , instead of localhost use 0.0.0.0
module.exports = {
    DB_NAME: getMyEnv("DB_NAME"),
    DB_URL: getMyEnv("DB_URL")
}