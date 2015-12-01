"use strict";

/**
 *  MinerCtrl
 *  @desc Mines All the data
 *  TODO Arrange week data in perioids & by year
 */

var Requester = require(__dirname + "/Requester");
var Parser = require(__dirname + "/Parser");
var DataHandler = require(__dirname + "/DataHandler");

var MinerCtrl = function MinerCtrl() {

    //this
    var miner = {};

    //this.config
    //defaults
    miner.config = {
        "future": true
    };

    //root url to mine
    var urlRoot = "http://lukkari.turkuamk.fi";

    //data
    //mined pages -> prevent loop
    var minedPages = [];
    var pagesToBeMined = [];

    //For DB actions
    //campusIds
    var campusId = {};
    //classIds
    var classId = {};

    //Campus name being mined
    var campusActiveName = undefined;

    //Mining recursion array holder thing
    var previousMined = [];

    /*
     * PRIVATE FUNCTIONS
     */

    /*
    * Get data from the DB and assign references to mongo object ids for reference
    * @param target name to save
    * @param target object to save - pass by reference
    * @param cb
     */
    var getDataSaveName = function getDataSaveName(target, saveTo, cb) {

        DataHandler.get(target, function (err, data) {

            if (err) console.warn(err);else {
                for (var i = 0; i < data.length; i++) {
                    saveTo[data[i].name] = data[i]._id;
                }
            }

            cb();
        });
    };

    /*
    * Handle class id references
     */
    var getClassIds = function getClassIds(cb) {

        var targetModel = undefined;

        //find model name
        for (var key in campusId) {
            if (key === campusActiveName) {
                targetModel = key + "_classes";
                break;
            }
        }

        //create reference
        getDataSaveName(targetModel, classId, cb);
    };

    /*
     * Mines a single layer
     * @param url to request
     * @param cb
     * @return obj[
     *  links: list of links in a page, props: href, text
     *  week: test result if this is a week
     *  isWeek: test result if this is a week
     *  isClassList test result if this is a class list (therefor links: are links to classes' schedules)
     */
    var ReqAndParseLinks = function ReqAndParseLinks(url, cb) {

        var attrs = ["href"];
        var selector = "p a";
        var selectorSecondary = "td a";
        var element = "a";

        var parsedRequest = {};

        //TODO: don't mine pages in minepages[]
        Requester.get(url, function (err, res) {

            if (err) {
                console.warn(err);
                cb(null);
            } else {
                //initial test
                //TRUE: this is not a week list
                var isLayerPage = Parser.parseZ(res).selector(selector).find(element).attr(attrs);

                if (isLayerPage[0]) parsedRequest = Parser.parseLinks(res, selector, element, attrs, url, minedPages);else parsedRequest = Parser.parseLinks(res, selectorSecondary, element, attrs, url, minedPages);

                //'tis mined & done
                minedPages.push(url);

                cb(parsedRequest);
            }
        });
    };

    /*
    * Mine a page
    * @param url to mine
    * @param cb
     */
    function mineLayer(url, cb) {

        ReqAndParseLinks(url, function (linkList) {
            cb(linkList);
        });
    }

    /*
    * Request layers until a classList is found
     */
    var classListActive = false;
    var atRootButNotPopped = false;

    function requestLayer(pages, i, nullArg) {

        mineLayer(pages[i].href, function (layer) {

            //if this layer doesn't have class schedules in its links
            if (!layer.isClassList) {
                if (!classListActive && !nullArg) {
                    // console.log("pushing",pages, "to previousMined");
                    previousMined.push(pages);
                }

                requestLayer(layer.links, i, false);
            }
            //Else handle class list
            else {
                    handleClasses(layer, pages, i);
                }
        });
    }

    /*
     * Handle initial request
     * @param list of campuses
     */
    function handleCampuses(campuses, cb) {

        stepForCampus(0, campuses, function () {
            getDataSaveName("campus", campusId, function () {}); //save ref's to campus data
            createWeekSchema(campusActiveName + "_classes"); //PASS IN REF NAME

            cb();
        }); //save all campuses
    }

    /*
     * Handle Classlist request
     * @param list of clasees
     */
    function handleClasses(layer, pages, i) {

        stepForClass(0, layer.links, function () {

            //Are these schedules relevant|in the future?
            if (layer.isInFuture && miner.config.future) {
                mineWeeks(layer.links, function () {
                    console.log("Weeks saved");
                    requestIsClasses(pages, i); //If done continue
                });
            } else {
                    console.log("skipping schedules@ handleClasses, time irrelevant");
                    requestIsClasses(pages, i); //If done continue
                }
        });
    }

    /*
    * This request is a class list and has the schedules inside
    * Mine em!
     */
    function requestIsClasses(pagesToBeMinedArg, i) {

        i += 1;

        if (i < pagesToBeMinedArg.length - 1) {
            requestLayer(pagesToBeMinedArg, i);
        } else {
            //This is quite a mess still

            i = 0;
            classListActive = true;
            var popped = undefined;

            //Take out the previous link
            previousMined[previousMined.length - 1].shift();

            //While there's no more links to mine in this layer -> go back a layer
            while (!previousMined[previousMined.length - 1].length) {
                previousMined.pop();
                popped = true;
                classListActive = false;
            }

            //If we've gone back a level take out the previous from this level- it's already mined
            if (popped) previousMined[previousMined.length - 1].shift();

            //We're at root level?
            var isAtRoot = previousMined.length === 1;

            //in case we're at the root level & the last item wasn't popped
            if (isAtRoot && !popped) {
                classListActive = false;
            }

            var ac = previousMined[previousMined.length - 1];

            if (ac.length) {
                if (isAtRoot) campusActiveName = ac[0].name;

                //And it all starts again
                requestLayer(ac, i, isAtRoot);
            } else console.log("I can't believe you've done this"); // Else we're done!
        }
    }

    function mineWeeks(weekList, cb) {
        getClassIds(function () {

            stepForWeekMine(0, weekList, function () {

                cb();
            });
        });
    }

    /*
    * Save each campus
    * @desc Async for loop
     */
    function stepForCampus(i, data, cb) {

        if (i < data.length) {
            saveCampus(data[i].name, "campus", function () {

                i++;
                stepForCampus(i, data, cb);
            });
        } else cb();
    }

    /*
     * Save each class
     * @desc Async for loop
     */
    function stepForClass(i, data, cb) {

        if (i < data.length - 1) {
            saveClass(data[i].name, campusActiveName, function () {

                i++;
                stepForClass(i, data, cb);
            });
        } else cb();
    }

    /*
     * Save each week
     * @desc Async for loop
     */
    function stepForWeekMine(i, weekList, cb) {

        if (i < weekList.length - 1) {
            mineLayer(weekList[i].href, function (week) {

                saveWeek(week.week, weekList[i].name, campusActiveName, function () {

                    i++;
                    stepForWeekMine(i, weekList, cb);
                });
            });
        } else cb();
    }

    /*
    * Makes objects to save to DB
    * @param name of this DB entry
    * @return obj
    * TODO check that the new Date() constructor is ok, not UTCDate? toString() ?
     */
    function objectMaker(name) {

        return {
            name: name,
            created_at: new Date(),
            modified_at: new Date()
        };
    }

    /*
    * Save campus to DB
     */
    function saveCampus(name, target, cb) {

        var obj = objectMaker(name);

        DataHandler.save(obj, target, null, function (err, affected) {

            if (err) console.warn(err);
            // else console.log("saved", name, "affected", affected)
            else cb();
        });
    }

    /*
     * Save class to DB
     */
    function saveClass(name, target, cb) {

        var obj = objectMaker(name);

        obj.campus = campusId[target];

        DataHandler.register(obj, target + "_classes", "campusClass", function (err, affected) {

            if (err) console.warn(err);
            //else console.log("saved", name, "affected", affected);
            else cb();
        });
    }

    /*
     * Save week to DB
     */
    function saveWeek(week, className, campusName, cb) {

        week.created_at = new Date();week.modified_at = new Date();
        week.class = classId[className];

        DataHandler.saveWeek(week, campusName + "_weeks", "campusClassWeek", function (err, affected) {

            if (err) console.warn(err);else {
                //console.log("week saved", className,affected);
                cb();
            }
        });
    }

    /*
     * Schema for weeks
     * TODO: put this in somewhere else
     */
    function createWeekSchema(refVal) {

        var sch = {
            weekNumber: Number,
            dateRange: String,
            schedule: [],
            created_at: Date,
            modified_at: Date
        };

        DataHandler.registerSchema("campusClassWeek", sch, "class", refVal);
    }

    /*
     * PUBLIC FUNCTIONS
     */

    //config setters/getters
    miner.setConfig = function (key, val) {
        miner.config[key] = val;
    };

    //Test: mine a single page
    miner.test = function () {
        mineLayer(miner.config.single, function (campusesData) {});
    };

    //Start the miner, mine everything choo choo
    miner.start = function () {
        //start:1
        mineLayer(urlRoot, function (campusesData) {
            //save all campuses, after
            handleCampuses(campusesData.links, function () {

                //set all pages to be mined
                pagesToBeMined = [campusesData.links[0]];
                //reference to the first campus we're going to mine
                campusActiveName = campusesData.links[0].name;
                //start recursion
                requestLayer(pagesToBeMined, 0, false);
            });
        }); //start:1
    };

    return miner;
};

module.exports = MinerCtrl();