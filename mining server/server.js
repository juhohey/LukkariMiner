var http = require('http');
var express = require('express');
var mongoose = require('mongoose');
var Miner = require("./nodedist/controllers/Miner.js");

var app = express();

var config = require("./config/data");

//App config
mongoose.connect(config.database); // connect to database

//Set req timeout
global.REQUEST_TIMEOUT = 500;
Miner.start();
