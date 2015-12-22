/**
* Data Factory
* @desc communicates with the api, returns promises of data
*/

angular.module(APPNAME).factory("dataFact",dataFact);


function dataFact(httpFact, $q, $timeout){

    //this
	let dataF = {};

    //is this initalized?
    dataF.init;
    //2 possibilities
    //1: .init gets called
    //2. single schedule gets called

    //data we're serving
    dataF.campuses = [];
    dataF.weeks = [];

    //used to parse the week num
    let date = new Date();

    //check these in getters
    //if data not yet loaded from API ()=> that's a paddlin'
    let promises ={
        campuses : false,
        classes : false,
        weeks:false
    };

    //Public functions

    /*
     * Get campuses data from API
     */
    dataF.init = function(){
        dataF.init = true;
        console.log("Data factory initialized, getting data")
        httpFact.get("/campus").then((d)=>{
            dataF.campuses = d.data;
            promises.campuses = true;
            dataF.initClasses();
        })
        .catch((err)=>{
            console.warn("err@datafact campus",err);
        });
    };

    /*
    * Get classes data from API
     */
    dataF.initClasses = function(){

        //Async step func
        function step(i) {
            httpFact.get("/campus/" + encodeURI(dataF.campuses[i].name) + "/classes").then((d)=> {
                parseCampuses(d.data, "classes");
                if(i<dataF.campuses.length-1) step(i+=1);
                else{   //Classes done
                    console.log("classes done");
                    promises.classes = true;
                    dataF.initWeeks();
                }
            });
        }
        step(0);
    };

    /*
     * Get weeks data from API
     */
    dataF.initWeeks = function(){

        //Async step func
        function step(i) {
            httpFact.get("/campus/" + encodeURI(dataF.campuses[i].name) + "/weeks").then((d)=> {
                dataF.weeks.push(d.data);
                if(i<dataF.campuses.length-1) step(i+=1);
                else{ //weeks done
                    promises.weeks = true;
                    console.log("weeks done");
                }
            });
        }
        step(0);
    };



    /*
     Getters
     */

     /**
     * Parse a week's data based on selected date & class name
     * @param seachModel obj - .weekNumber: .name: 
     */
    dataF.getWeekData = function(seachModel){
        var promise = $q.defer();
        let w = new Date(date).getWeek();
        let target;
        //Weeks = all campuses all weeks
        for(let i = 0;i<dataF.weeks.length;i++){
            //Weeks[i] = all weeks from 1 campus
            for(let j = 0;j<dataF.weeks[i].length;j++){ 
                //Weeks[i][j] = data from 1 weeks from 1 campus
                //Has class:asdasd , weekNumber:49
                if(dataF.weeks[i][j].class===seachModel.class&&dataF.weeks[i][j].weekNumber===w){
                  // console.log("match!",dataF.weeks[i][j],w);
                    dataF.weeks[i][j].name = seachModel.name;

                    target = dataF.weeks[i][j];
                    //console.log(target);
                    break;
                }
            }
        }
        //Case where there is no week data
        if(!target) promise.reject("No schedule found");
        else {
            //get campus name
            dataF.campuses.forEach((el, i, a)=> {
                    dataF.campuses[i].classes.forEach((eli, j, ar)=> {
                        //console.log(dataF.campuses[i].classes[j].name,dataF.campuses[i].classes[j]._id,target.class)
                        // console.log(dataF.campuses[i].classes[j]._id===target.class,dataF.campuses[i].classes[j]._id,target.class)
                        if (dataF.campuses[i].classes[j]._id === target.class) {
                            target.campus = dataF.campuses[i].name;
                            //  console.log(target);
                            promise.resolve(target);
                        }
                    })
                }
            );
        }
        return promise.promise;

    };

    /*
    * Campus | Class | Week
    * If data not yet loaded resolve, wait a sec, if still not reject
     */
    dataF.getCampus = function(){
        return $q((resolve, reject)=>{
            checkForStatusReturnPromise("campuses","campuses", resolve, reject);
        });
    };
    dataF.getCampusData = function(){
        return $q((resolve, reject)=>{
            checkForStatusReturnPromise("classes","campuses", resolve, reject);
        });
    };
    dataF.getCampusWeeks = function(){
        return $q((resolve, reject)=>{
            checkForStatusReturnPromise("weeks","weeks", resolve, reject);
        });
    };



    /**
     * Return a week schedule
     * Note that we cant return something we don't have -> make sure we have the data first, then parse
     * @param currentByState - obj: week number, class name OPTIONAL class id
     * @return promise of data
     *
     */
    dataF.getSchedule = function(currentByState){
        return $q((resolve, reject)=>{

            let returnVal;
            if(promises.weeks) mainLoop();

            else{
                $timeout(()=>{
                    if(promises.weeks) mainLoop();
                    else reject("API unavailable at this time, so sorry")
                },5000)
            }

            function mainLoop(){
                if(!currentByState.classId) getClassData();
                console.log(currentByState);
                resolve(getWeekDataSchedule());
            }

            //private mapping function, find class id by name
            function getClassData(){
                for(let i = 0;i< dataF.campuses.length;i++){
                    for(let j = 0;j<dataF.campuses[i].classes.length;j++){
                        if (dataF.campuses[i].classes[j].name === currentByState.name){
                            currentByState.classId = dataF.campuses[i].classes[j]._id;
                            return;
                        }
                    }
                }
            }
        });
    };
    dataF.getSingleSchedule = function(sch){
        return $q((resolve, reject)=> {
            console.log(sch)
            let returnVal;
            if (promises.weeks) resolve(getWeekDataSchedule(sch));
            else {
                httpFact.get("/campus/" +
                    encodeURI(sch.campus) +
                    "/classes/" +
                    sch.class + "/"+
                    sch.weekNumber
                ).then((d)=> {
                    console.log(d);
                   // dataF.init();

                    resolve(d.data);
                }).catch((err)=> {
                    console.log(err)
                    reject(err);
                })
            }
        })

    };

    //Private

    /**
     * Parse week from desired params
     * @param currentByState:classId,currentByState.name
     * @returns schedule obj
     */
    function getWeekDataSchedule(currentByState){

        getClassData();
        function getClassData(){
            for(let i = 0;i< dataF.campuses.length;i++){
                for(let j = 0;j<dataF.campuses[i].classes.length;j++){
                    if (dataF.campuses[i].classes[j].name === currentByState.class){
                        currentByState.classId = dataF.campuses[i].classes[j]._id;
                        return;
                    }
                }
            }
        }
        console.log(currentByState);
        // console.log(dataF.weeks);
        for(let i = 0;i<dataF.weeks.length;i++){
            for(let j = 0;j<dataF.weeks[i].length;j++) {
                if (dataF.weeks[i][j].class === currentByState.classId) {
                    dataF.weeks[i][j].name = currentByState.name;
                    return dataF.weeks[i][j];
                }
            }
        }
    }
    /*
    * If data not yet loaded resolve, wait a sec, if still not reject
     */
    function checkForStatusReturnPromise(p, data, resolve, reject){
        if(promises[p]) resolve(dataF[data]);
        else{
            timeOut(0);
            function timeOut(i){
                $timeout(()=>{  // console.log(campuses);
                    if(promises[p]) resolve(dataF[data]);
                    else if(i<10) timeOut(++i);
                    else  reject("API unavailable at this time, so sorry");
                },500)
            }

        }
    }

    /*
    * Assign a campus it's classes
     */
    function parseCampuses(data, k){
       // console.log(data);
        for(let j = 0;j<dataF.campuses.length;j++){ 
            if(dataF.campuses[j]._id === data[0].campus){
                dataF.campuses[j][k] = data;
            }
        }
    }

    dataF.init(); //singletons <3
	return dataF;
}


dataFact.$inject = ["httpFact", "$q", "$timeout"];
