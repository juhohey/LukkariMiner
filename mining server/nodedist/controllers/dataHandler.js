"use strict";

/*
* DataHandler
* @desc handles data, gets data from and saves data to mongo
*/
var mongoose = require("mongoose");
var modelPath = "../models";
var Campus = require(modelPath + "/campus");

//Dynamic collections
var CampusClassSchema = require(modelPath + "/campusClass");
//collection creator
var SchemaCreator = require(modelPath + "/schemaCreator");

var DataHandler = function DataHandler() {

    //this
    var dataHandler = {};

    //map of models
    var models = {
        campus: Campus,
        campusClass: CampusClassSchema
    };

    /*
    * Primary function
    * @desc 1) updates data if exits 2) creates entry if not
    * @para data to save
    * @param model name
    * @param cb
     */
    dataHandler.save = function (data, target, model, cb) {

        //if target passed get the model from map, else use passed model
        var modelInstance = target ? models[target] : model;

        //query
        modelInstance.find({ "name": data.name }).exec(function (err, rows) {

            if (err) cb(err, null); //err
            else if (rows.length > 0) cb(null, null); //data exits TODO this is development

                else {
                        //no data, save
                        //We'll use update, no need to make a new instace
                        //TODO see if this is slower
                        modelInstance.update({ "name": data.name }, data, { upsert: true }, function (updateErr, affected) {

                            if (updateErr) cb(updateErr, null);else cb(null, affected);
                        });
                    }
        });
    };

    /*
     * Create model - save it
     * @para data to save
     * @param model name
     * @param schema to use
     * @param cb
     */
    dataHandler.register = function (data, target, schema, cb) {

        var model = undefined;
        model = mongoose.model(target, models[schema]);

        dataHandler.save(data, null, model, cb);
    };

    /*
    * Save single week
    * TODO refactor and combine to other method
     */
    dataHandler.saveWeek = function (data, target, schema, cb) {

        var model = mongoose.model(target, models[schema]);

        //query
        model.find({ "dateRange": data.dateRange, "class": data.class }).exec(function (err, rows) {

            if (err) cb(err, null); //err
            else if (rows.length > 0) cb(null, null); //data exits

                else {
                        //no data, save
                        //query
                        model.update({ "dateRange": data.dateRange, "class": data.class }, data, { upsert: true }, function (updateErr, affected) {

                            if (updateErr) cb(updateErr, null);else cb(null, affected);
                        });
                    }
        });
    };

    /*
    * Register a new schema
     */
    dataHandler.registerSchema = function (name, fields, refKey, refVal) {
        models[name] = SchemaCreator.create(fields, refKey, refVal);
    };

    /*
    * Get data
    * @param what collection
    * @param cb
     */
    dataHandler.get = function (model, cb) {

        var modelInstance = models[model] ? models[model] : mongoose.model(model, CampusClassSchema);

        //query
        modelInstance.find().exec(function (err, data) {

            if (err) cb(err, null);else cb(null, data);
        });
    };

    return dataHandler;
};

module.exports = DataHandler();