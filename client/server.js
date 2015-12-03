var http = require('http'); 
var express = require('express');
var mongoose = require('mongoose');
var app = express();

//App config
var config = require("./config/data");
mongoose.connect(config.database); // connect to database


app.use(express.static(__dirname+"/dist"));
//routes
require("./nodedist/routes")(app,express);

app.listen(1337);
