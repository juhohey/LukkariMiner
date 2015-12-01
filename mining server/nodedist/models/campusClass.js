"use strict";

/*
* Model: campus
*/

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CampusClass = new Schema({
    name: String,
    campus: [{ ref: 'Campus', type: Schema.Types.ObjectId }],
    created_at: Date,
    modified_at: Date
});

//let Model = mongoose.model("Model", myModel);

module.exports = CampusClass;