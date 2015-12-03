
 /*
* Model: campus class
*/

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let CampusClass = new Schema({
    name: String,
    campus:[{ref: 'Campus', type: Schema.Types.ObjectId}],
    created_at: Date,
    modified_at: Date
});

module.exports = CampusClass;
