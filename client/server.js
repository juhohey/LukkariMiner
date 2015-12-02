var http = require('http'); 
var express = require('express');
var mongoose = require('mongoose');
var app = express();

//CORS: accept all - development
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With, x-api-token, Accept');
    next();
};

//App config
var config = require("./config/data");
//app.set('superSecret', config.secret); // secret variable
mongoose.connect(config.database); // connect to database


app.use(express.static(__dirname+"/dist"));
//routes
require("./nodedist/routes")(app,express);

//Set req timeout
global.REQUEST_TIMEOUT = 500;

app.listen(1337);