
/**
* DataHandler
* @desc handles data, gets data from and saves data to mongo
*/
let mongoose = require("mongoose");
let modelPath = "../models";
let Campus = require(modelPath+"/campus");

//Dynamic collections
let CampusClassSchema = require(modelPath+"/campusClass");
//collection creator
let SchemaCreator = require(modelPath+"/schemaCreator");

let DataHandler = function( ) {

    //this
    let dataHandler = {};

    //map of models
    let models = {
        campus:Campus,
        campusClass: CampusClassSchema
    };

    /**
    * Primary function
    * @desc 1) updates data if exits 2) creates entry if not
    * @param data to save
    * @param target model model name
      @param model if no target model the model to be used
    * @param cb
     */
    dataHandler.save = function(data, target, model, cb){

        //if target passed get the model from map, else use passed model
        let modelInstance = target ? models[target] : model;

        //query
        modelInstance.find({"name":data.name}).exec((err, rows)=>{

           if (err) cb(err, null); //err
           else if(rows.length>0) cb(null, null); //data exits TODO this is development

           else{ //no data, save
                //We'll use update, no need to make a new instace
               //TODO see if this is slower
               modelInstance.update({"name":data.name}, data, {upsert:true},(updateErr, affected)=>{

                   if (updateErr) cb(updateErr, null);
                   else cb(null, affected);
               });
           }
        });
    };

    /**
     * Create model - save it
     * @para data to save
     * @param target model name
     * @param schema to use
     * @param cb
     */
    dataHandler.register = function(data, target, schema, cb){

        let model;
        model = mongoose.model(target, models[schema]);

        dataHandler.save(data, null, model, cb);
    };

    /**
    * Save single week
    * TODO refactor and combine to other method
     */
    dataHandler.saveWeek =  function(data, target, schema, cb){

        let model = mongoose.model(target, models[schema]);

        //query
        model.find({"dateRange":data.dateRange,"class":data.class}).exec((err, rows)=>{

            if (err) cb(err, null); //err
            else if(rows.length>0) cb(null, null); //data exits

            else{ //no data, save
                //query
                model.update({"dateRange":data.dateRange,"class":data.class}, data, {upsert:true},(updateErr, affected)=>{

                    if (updateErr) cb(updateErr, null);
                    else cb(null, affected);
                });
            }
        });
    };

    /*
    * Register a new schema
     */
    dataHandler.registerSchema = function(name, fields, refKey, refVal){
        models[name] = SchemaCreator.create(fields, refKey, refVal);
    };

    /**
    * Get data
    * @param model what collection
    * @param cb
     */
    dataHandler.get = function(model, cb){

        let modelInstance = models[model] ? models[model] : mongoose.model(model, CampusClassSchema);

        //query
        modelInstance.find().exec((err,data)=>{

            if (err) cb(err, null);
            else cb(null, data);
        });
    };

    return dataHandler;
};

module.exports = DataHandler();
