
 /*
* Nodemodule
* @desc Does things
*/
let mongoose = require("mongoose");

let modelPath = "../models";
let Campus = require(modelPath+"/campus");

 var uDtrl = function () {

     //this
     let ctrl = {};

     //map for campus classes weeks
     let models = {};

     //list all from passed model
     //@param
     ctrl.listCampus = function (name,cb){

         if(name){
             Campus.find({"name":name}).exec(function(err, dbData){
                 if (err) return cb(err);
                 else cb(null, dbData);
             });
         }
         else {
             Campus.find().exec(function (err, dbData) {

                 if(!Object.keys(models).length) makeWeeksAndClassesForCampuses(dbData);
                 if (err) return cb(err);
                 else cb(null, dbData);
             });
         }
     };

     //list all from passed model
     //@param
     ctrl.listClass = function (campus, cb){

        let m = decodeURI(campus.toLowerCase())+"_classes";
        console.log(m, models[m]);
        models[m].find().exec(function(err, dbData){
             if (err) return cb(err);
             else cb(null, dbData);
        });
     };

     //list all from passed model
     //@params
     ctrl.listCampusWeeks = function (campus, cb){
         let m = decodeURI(campus.toLowerCase())+"_weeks";

         models[m].find().exec(function(err, dbData){
             if (err) return cb(err);
             else cb(null, dbData);
         });
     };

     /*
     * Dynamically generate schemas
      */
     function makeWeeksAndClassesForCampuses(campusArray){
         for(let i = 0;i<campusArray.length;i++){

             let sC = campusArray[i].name.toLowerCase() + "_classes";
             let wC = campusArray[i].name.toLowerCase()+ "_weeks";


            models[sC] = mongoose.model(sC, new mongoose.Schema({name: String})) ;
            models[wC] = mongoose.model(wC, new mongoose.Schema({})) ;

         }
        // console.log(models)
        // let m = new mongoose.Schema({name: String});
        // let m1 = mongoose.model("sC",m);
     }

     /*
     *  On init build classes / weeks schemas
      */
     (function(){
        ctrl.listCampus(null, ()=>{});
     })();
     return ctrl;

 };

module.exports = uDtrl();
