
 /*
* Model: Creator
*/

let mongoose = require("mongoose");
let Schema = mongoose.Schema;


let SchemaCreator = function(){

    //This
    let sch = {};

    /*
    * Add an mongoose ObjectId reference to a otherwise ready schema
    * @param data - the model object
    * @param the name of the reference
    * @param the collection of the reference
    * @return a new usable schema
     */
    sch.create = function(data, refKey, refVal){
        data[refKey] = [{ref: refVal, type: Schema.Types.ObjectId}];
        return new Schema(data);
    };

    return sch;
};


module.exports = SchemaCreator();