/**
 *  MinerCtrl
 *  @desc Mines All the data
 *  TODO Arrange week data in perioids & by year
 */

var Requester = require(__dirname+"/Requester");
var Parser = require(__dirname+"/Parser");
var DataHandler = require(__dirname+"/DataHandler");

let MinerCtrl = function(){

    //this
    let miner = {};

    //this.config
    //defaults
    miner.config = {
        "future":true
    };

    //root url to mine
    let urlRoot = "http://lukkari.turkuamk.fi";

    //data
    //mined pages -> prevent loop
    let minedPages = [];
    let pagesToBeMined = [];

    //For DB actions
    //campusIds
    let campusId = {};
    //classIds
    let classId = {};

    //Campus name being mined
    let campusActiveName;

    //Mining recursion array holder thing
    let previousMined = [];

    /*
     * PRIVATE FUNCTIONS
     */

    /*
    * Get data from the DB and assign references to mongo object ids for reference
    * @param target name to save
    * @param target object to save - pass by reference
    * @param cb
     */
    let getDataSaveName = function(target, saveTo, cb){

        DataHandler.get(target, (err,data)=>{

            if(err) console.warn(err);
            else{
                for(let i = 0;i<data.length;i++){
                    saveTo[data[i].name] = data[i]._id;
                }
            }

            cb();
        });
    };

    /*
    * Handle class id references
     */
    let getClassIds = function(cb){

        let targetModel;

        //find model name
        for(let key in campusId){
            if(key===campusActiveName){
                targetModel = key +"_classes";
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
    let ReqAndParseLinks = function(url,cb){

        let attrs = ["href"];
        let selector = "p a";
        let selectorSecondary = "td a";
        let element = "a";

        let parsedRequest = {};

        //TODO: don't mine pages in minepages[]
        Requester.get(url, (err, res)=>{

            if(err) {
                console.warn(err);
                cb(null);
            }
            else {
                //initial test
                //TRUE: this is not a week list
                let isLayerPage = Parser.parseZ(res).selector(selector).find(element).attr(attrs);

                if (isLayerPage[0]) parsedRequest = Parser.parseLinks(res, selector, element, attrs, url, minedPages);
                else parsedRequest = Parser.parseLinks(res, selectorSecondary, element, attrs, url, minedPages);

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
    function mineLayer(url, cb){

        ReqAndParseLinks(url, (linkList) => {
            cb(linkList);
        });
    }



    /*
    * Request layers until a classList is found
     */
    let classListActive = false;
    let atRootButNotPopped = false;

    function requestLayer(pages, i, nullArg){

        mineLayer(pages[i].href, (layer)=> {

            //if this layer doesn't have class schedules in its links
            if (!layer.isClassList) {
                if(!classListActive&&!nullArg){
                   // console.log("pushing",pages, "to previousMined");
                    previousMined.push(pages);
                }

                requestLayer(layer.links, i, false);
            }
            //Else handle class list
            else {
                handleClasses(layer,pages,i);
            }
        });
    }

    /*
     * Handle initial request
     * @param list of campuses
     */
    function handleCampuses(campuses, cb){

        stepForCampus(0, campuses, ()=>{
            getDataSaveName("campus", campusId, ()=>{}); //save ref's to campus data
            createWeekSchema(campusActiveName+"_classes"); //PASS IN REF NAME

            cb();
        });//save all campuses
    }

    /*
     * Handle Classlist request
     * @param list of clasees
     */
    function handleClasses(layer, pages, i){

        stepForClass(0, layer.links, ()=> {

            //Are these schedules relevant|in the future?
            if(layer.isInFuture&&miner.config.future) {
                mineWeeks(layer.links, ()=> {
                    console.log("Weeks saved");
                    requestIsClasses(pages, i); //If done continue
                })
            }
            else{
                console.log("skipping schedules@ handleClasses, time irrelevant");
                requestIsClasses(pages, i);     //If done continue
            }
        });
    }

    /*
    * This request is a class list and has the schedules inside
    * Mine em!
     */
    function requestIsClasses(pagesToBeMinedArg,i){

        i +=1;

        if(i<pagesToBeMinedArg.length-1){
            requestLayer(pagesToBeMinedArg, i);
        }
        else {
            //This is quite a mess still

            i = 0;
            classListActive = true;
            let popped;

            //Take out the previous link
            previousMined[previousMined.length - 1].shift();

            //While there's no more links to mine in this layer -> go back a layer
            while (!previousMined[previousMined.length - 1].length){
                previousMined.pop();
                popped = true;
                classListActive = false;
            }

            //If we've gone back a level take out the previous from this level- it's already mined
            if (popped) previousMined[previousMined.length - 1].shift();

            //We're at root level?
            let isAtRoot = previousMined.length===1;

            //in case we're at the root level & the last item wasn't popped
            if(isAtRoot&&!popped){
                classListActive = false;
            }

            let ac = previousMined[previousMined.length-1];

            if(ac.length){
                if(isAtRoot) campusActiveName = ac[0].name;

                //And it all starts again
                requestLayer(ac, i, isAtRoot);
            }
            else console.log("I can't believe you've done this"); // Else we're done!
        }
    }

    function mineWeeks(weekList, cb){
        getClassIds(()=>{

            stepForWeekMine(0,weekList,()=>{

               cb();
            });
        });
    }

    /*
    * Save each campus
    * @desc Async for loop
     */
    function stepForCampus(i, data, cb){

        if(i<data.length){
            saveCampus(data[i].name,"campus", ()=>{

                i++;
                stepForCampus(i, data, cb);
            });
        }

        else cb();
    }

    /*
     * Save each class
     * @desc Async for loop
     */
    function stepForClass(i, data, cb){

        if(i<data.length-1){
            saveClass(data[i].name, campusActiveName, ()=>{

                i++;
                stepForClass(i, data, cb);
            });
        }

        else cb();
    }

    /*
     * Save each week
     * @desc Async for loop
     */
    function stepForWeekMine(i, weekList, cb){

        if(i<weekList.length-1){
            mineLayer(weekList[i].href, (week)=> {

                saveWeek(week.week, weekList[i].name, campusActiveName, ()=> {

                    i++;
                    stepForWeekMine(i, weekList, cb)
                });
            });
        }

        else cb();
    }

    /*
    * Makes objects to save to DB
    * @param name of this DB entry
    * @return obj
    * TODO check that the new Date() constructor is ok, not UTCDate? toString() ?
     */
    function objectMaker(name){

        return {
            name: name,
            created_at: new Date(),
            modified_at: new Date()
        };
    }

    /*
    * Save campus to DB
     */
    function saveCampus(name, target, cb){

        let obj = objectMaker(name);

        DataHandler.save(obj, target, null, (err, affected)=> {

            if(err) console.warn(err);
            // else console.log("saved", name, "affected", affected)
            else cb();
        });
    }

    /*
     * Save class to DB
     */
    function saveClass(name, target, cb){

        let obj = objectMaker(name);

        obj.campus = campusId[target];

        DataHandler.register(obj, target+"_classes", "campusClass", (err, affected)=> {

           if(err) console.warn(err);
           //else console.log("saved", name, "affected", affected);
           else cb();
        });
    }

    /*
     * Save week to DB
     */
    function saveWeek(week, className, campusName, cb){

        week.created_at = new Date(); week.modified_at = new Date();
        week.class = classId[className];

        DataHandler.saveWeek(week, campusName+"_weeks", "campusClassWeek", (err, affected)=> {

            if(err) console.warn(err);
            else{
                //console.log("week saved", className,affected);
                cb();
            }
        });
    }

    /*
     * Schema for weeks
     * TODO: put this in somewhere else
     */
    function createWeekSchema(refVal){

        var sch ={
            weekNumber: Number,
            dateRange: String,
            schedule:[],
            created_at: Date,
            modified_at: Date
        };

        DataHandler.registerSchema("campusClassWeek", sch, "class", refVal);
    }

    /*
     * PUBLIC FUNCTIONS
     */

    //config setters/getters
    miner.setConfig = function(key, val){
        miner.config[key] = val;
    };

    //Test: mine a single page
    miner.test = function(){
        mineLayer(miner.config.single,(campusesData)=>{});
    };

    //Start the miner, mine everything choo choo
    miner.start = function(){
        //start:1
        mineLayer(urlRoot,(campusesData)=>{
            //save all campuses, after
            handleCampuses(campusesData.links, ()=>{

                //set all pages to be mined
                pagesToBeMined = [campusesData.links[0]];
                //reference to the first campus we're going to mine
                campusActiveName = campusesData.links[0].name;
                //start recursion
                requestLayer(pagesToBeMined, 0, false);

            });

        });//start:1
    };

    return miner;
};

module.exports = MinerCtrl();

/*
    DUMP
 */
/*

//Start the miner, mine all
miner.startMiner = function(){

    console.log("starting miner");
    let element  = "a";
    let attrs = ["href"];

    //first req: get campuses
    ReqAndParseLinks(urlUse, "p a",element,attrs, (linkList) =>{
        campuses = linkList;
        console.log("campuses mined");

        //second req: qet campus info
        testCampus = campuses[0];
        let campusLinks = [];
        filterUrl(testCampus.href);
        ReqAndParseLinks(urlUse, "p a",element,attrs, (linkList) =>{
            console.log(`${testCampus.name}  mined`);
            campusLinks = linkList;
            //SAVE
            saveCampus(testCampus.name,"campus");

            //third req: qet campus week info
            let weekList = [];
            filterUrl(campusLinks[0].href);
            ReqAndParseLinks(urlUse, "td a",element,attrs, (linkList) =>{   //TODO! THESE LINKS HAVE A MIMOSA LINK, REMOVE
                console.log(`${campusLinks[0].name}  mined`);
                weekList = linkList;
                //console.log(weekList);

                //fourth req: qet campus week classes
                let classList = [];
                filterUrl(weekList[0].href);
                ReqAndParseLinks(urlUse, "td a",element,attrs, (linkList) =>{
                    console.log(`${weekList[0].name}  mined`);
                    classList = linkList;
                    //SAVE
                    saveClass(classList[0].name, testCampus.name);

                    //fifth req: qet campus week class schedule
                    let schedule = [];
                    filterUrl(classList[7].href);
                    ReqAndParseLinks(urlUse, "tr td",null,['rowspan'], (linkList) =>{
                        console.log(`${classList[0].name}  mined`);
                        schedule = linkList;
                        // console.log(schedule[1]);


                    });//req:Schedule
                });//req:weekLinks
            });//req:campusLinks
        });//req:campus
    }); //req:campuses

};*/

/*
function parseNextLayer(pagesToBeMinedArg){
    //layersDeep ++;


    let isFound = false;
    let noReferece = false;
    let arrayReference = [];

    // We'll need to reset the url since the structure is...
    urlIncrement = urlRoot;
    function nextLayer(arr, previous){
        for(let i = 0;i<arr.length;i++){
            //recursive
            if(arr[i].links){
                previous = arr[i];
                filterUrl(arr[i].href);
                //console.log("nextLayer");
                nextLayer(arr[i].links, previous);
            }
            else if(isFound) return;
            else{
                layersDeep ++;
                if(!arr[layersDeep]){
                    console.log("We need the previous!",arr);
                    delete previous.links;
                    noReferece = true;
                    isFound = true;
                    layersDeep = 0;
                    break;
                }
                else{
                    isFound = true;
                    console.log("isFound",arr[layersDeep]);
                    filterUrl(arr[layersDeep].href);
                    arrayReference = arr;
                    noReferece = false;
                    //console.dir(arr);
                }

                break;
                /!*  for(let j = 0;j<arr.length;j++){
                 //end of recursion, tih should be mined
                 if(arr[j].isMined){
                 layersDeep ++;
                 //if all item in this array
                 if (!arr[layersDeep]) return false;
                 else {
                 filterUrl(arr[layersDeep].href);
                 requestLayer(arr);
                 }
                 }
                 else{
                 // console.dir(arr);
                 }
                 }*!/
            }
        }
    }
    function requestNextLayer(){
        nextLayer(pagesToBeMinedArg,[]);
        while(noReferece){
            console.log("while(noReferece)");
            urlIncrement = urlRoot;
            isFound = false;

            nextLayer(pagesToBeMined,[]);
            // arrayReference = findReferenceInPagesToBeMined(arrayReference);
        }
        requestLayer(arrayReference);
    }
    requestNextLayer();

    /!*
     * Im tired, let's do this manually..
     *!/
    function findReferenceInPagesToBeMined(ref){
        console.log("Trying to find",ref);
        if(pagesToBeMined!==ref)
            for(let i = 0;i<pagesToBeMined.length;i++){
                if(pagesToBeMined[i]!=ref){
                    for(let j = 0;j<pagesToBeMined[j].length;j++){
                        if(pagesToBeMined[i][j]!=ref){              console.log("ref",pagesToBeMined[i][j]);
                            for(let k = 0;k<pagesToBeMined[k].length;k++){
                                if(pagesToBeMined[i][j][k]==ref) return pagesToBeMined[i][j][k];
                                else{
                                    console.log("ref",pagesToBeMined[i][j][k]);
                                }
                            }
                        }
                        else if(pagesToBeMined[i][j]==ref) return pagesToBeMined[i][j];
                    }
                }
                else if(pagesToBeMined[i]==ref) return pagesToBeMined[i];
            }
        console.warn("wtf m8");
        return false;
    }

}
function parseNextLayerV2(array){
    let linksLeft = findIFLinksLeft(array);
    if(linksLeft){
        requestLayer(array, linksLeft);
    }
    else{
        console.log("no links left, start from beginning");
        findNextUnMined();
    }
    function findIFLinksLeft(array){
        //console.log("findling if links left",array);
        for(let i = 0; i < array.links.length;i++){
            if(array.links[i]){
                if(!array.links[i].isMined) {
                    return i;
                }
            }
        }
        return false;

    }
}
function findNextUnMined(){

    let override = false;
    let arrayList = [];
    recursion(pagesToBeMined);
    function recursion(array){
        console.log("recursion",array)
        for(let i = 0;i<array.length;i++){
            //IF IT has a links array
            if(array[i].links){
                arrayList.push(array);
                recursion(array[i].links);
            }
            else if(override) return;
            //ELSE IT has actual links
            else{
                for(let j = 0;j<array[i].length;j++){
                    if(!array[i].isMined){
                        override = true;
                        console.log("found one!",array[i],array);
                        break;
                    }
                }
                override = true;
                console.log("Find one from previous",arrayList);
                arrayList = arrayList.pop();
                requestLayer(arrayList[arrayList.length-1], 0);
            }
            console.log("wat")
        }
    }
/*
 /!*
 *   Increment url and set next used url
 *   if new url is .htm don't increment
 *   @param new url
 *!/
let filterUrl = function(newUrl){
    if(newUrl.indexOf("htm")>0) urlUse = urlIncrement + "/"+ newUrl;
    else{
        urlIncrement = urlIncrement + "/"+newUrl;
        if(urlIncrement.substr(-1)==="/") urlIncrement = urlIncrement.substr(0,urlIncrement.length-1);
        urlUse = urlIncrement;
    }
};
let filterUrlPrevious = function(arg){
    console.log("filterUrlPrevious.start",urlUse);
    let urlArr = urlUse.split("/");
    urlArr.splice(urlArr.length-1, 1);
    urlArr = urlArr.join("/");
    urlUse = urlArr +"/"+arg;
    console.log("filterUrlPrevious.end",urlUse)
};*/

/*  //if the response is null backtrack
 if(!layer){
 //back the url up
 //filterUrlPrevious(pagesToBeMinedArg.href);
 requestLayer(pagesToBeMinedArg);
 }
 else {
 if (layer.links[layersDeep]) filterUrl(layer.links[layersDeep].href);

 //request until classList
 if (!layer.isClassList) {
 pagesToBeMinedArg[layersDeep].links = layer.links;
 //layersDeep ++;
 //refresh url
 requestLayer(pagesToBeMinedArg[layersDeep].links);
 }
 //handle classList
 else {
 pagesToBeMinedArg[layersDeep].isMined = true;
 // console.log("pagesToBeMined",pagesToBeMinedArg);
 requestIsClasses(pagesToBeMinedArg);
 }
 };*/