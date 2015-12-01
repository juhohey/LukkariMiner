"use strict";

/*
* Model: Creator
*/

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var SchemaCreator = function SchemaCreator() {

    //This
    var sch = {};

    /*
    * Add an mongoose ObjectId reference to a otherwise ready schema
    * @param data - the model object
    * @param the name of the reference
    * @param the collection of the reference
    * @return a new usable schema
     */
    sch.create = function (data, refKey, refVal) {
        data[refKey] = [{ ref: refVal, type: Schema.Types.ObjectId }];
        return new Schema(data);
    };

    return sch;
};

module.exports = SchemaCreator();