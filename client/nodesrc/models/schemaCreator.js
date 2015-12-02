
 /*
* Model: Creator
*/

let mongoose = require("mongoose");
let Schema = mongoose.Schema;


let SchemaCreator = function(){

    let sch = {};
    sch.create = function(data, refKey, refVal){
        data[refKey] = [{ref: refVal, type: Schema.Types.ObjectId}];
        return new Schema(data);
    };
    return sch;
};


module.exports = SchemaCreator();