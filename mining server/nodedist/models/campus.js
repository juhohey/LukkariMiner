"use strict";

/*
* Model: campus
*/

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CampusModel = new Schema({
    name: String,
    created_at: Date,
    modified_at: Date
});

var Campus = mongoose.model("Campus", CampusModel);

module.exports = Campus;