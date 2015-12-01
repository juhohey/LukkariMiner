 /*
* Model: campus
*/

let mongoose = require("mongoose");
let Schema =  mongoose.Schema;

let CampusModel = new Schema({
    name:String,
    created_at:Date,
    modified_at:Date
});

let Campus = mongoose.model("Campus", CampusModel);

module.exports = Campus;