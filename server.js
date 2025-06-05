// This is the File from where the whole Project Will Start Running

const express = require("express");
const mongoose = require("mongoose");
const serverConfigs = require("./Configs/server.config");
const app = express();

app.listen(serverConfigs.PORT_NUMBER,()=>{
    console.log("Server has Started at Port Number: "+serverConfigs.PORT_NUMBER);
});