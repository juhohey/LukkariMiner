'use strict';

/*
* Angular module
*/

var APPNAME = "lukkari";

angular.module(APPNAME, ['ui.router', 'ngMaterial', 'ngSanitize']);

/*
* Utility
 */
Date.prototype.getWeek = function () {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil(((this - onejan) / 86400000 + onejan.getDay() + 1) / 7);
};
"use strict";
'use strict';

/*
*	UI Routes
*/
angular.module(APPNAME).config(states, "states");
states.$inject = ['$stateProvider', '$urlRouterProvider'];

function states($stateProvider, $urlRouterProvider) {
	"use strict";

	$urlRouterProvider.otherwise("find");
	var route = "";
	$stateProvider.state("find", {
		url: "/find",
		templateUrl: "/app/find/find.html"
	}).state("schedule", {
		url: route + "/schedule",
		templateUrl: "/app/schedule/schedule.html"
	}).state("schedule.campus", {
		url: route + "/:campus",
		templateUrl: "/app/schedule/schedule.html"
	}).state("schedule.class", {
		url: route + "/:cName",
		templateUrl: "/app/schedule/schedule.html"
	}).state("schedule.class.week", {
		url: route + "/:wn",
		templateUrl: "/app/schedule/schedule.html"
	}).state("schedule.campus.class", {
		url: route + "/:cName",
		templateUrl: "/app/schedule/schedule.html"
	}).state("schedule.campus.class.week", {
		url: route + "/:wn",
		templateUrl: "/app/schedule/schedule.html"
	});
}
"use strict";

/**
* Auto fill | Note this is redundant since we're using ng-material
* @desc *Auto fills searches*
* @param: auto-fill-vm: vm to target
* @param: auto-fill-src: a property of vm to search
* @param: auto-fill-keys: keys to search in src | string or array
* @param: auto-fill-cb: function to execute on user action, passed the key and it's path found
*/

angular.module(APPNAME).directive("autoFill", autoFill);

autoFill.$inject = ["$compile"];

function autoFill($compile) {

    return {
        scope: "=",
        link: linkFunc,
        template: "",
        restrict: "E"
    };

    function linkFunc(scope, element, attrs) {

        var vm = scope[attrs.autoFillVm];
        var keys = undefined;

        function keysZ() {
            keys = attrs.autoFillKeys.split(",");
        }

        keysZ();

        //scope.outputs =[0,0,0,0,0,0,0,0,0,0];
        // let src = vm[attrs.autoFillVmSrc];
        // let cb = vm[attrs.autoFillCb];

        var targetArr = [];
        scope.searchModel = [];
        if (!targetArr.length) map();

        var init = (function () {
            var el = "<div ng-click='searchThis()' class='search'>" + "<input class='data-search' type='text' ng-model='searchModel' ng-change='inputChanged()'>" + "<div class='search-output'><div class='item item-label search-output-single' ng-repeat='searchOutput in outputs track by $index' >" + "<span ng-click='activateSeachOutput(searchOutput)' class=''>{{searchOutput.name}}</span></div></div></div>";

            element.append($compile(el)(scope));
        })();

        //Event listeners
        /* scope.searchThis = function () {
             //console.log(attrs, attrs.autoFillVmTarget)
             //console.log(src,attrs.autoFillVmSrc, vm[attrs.autoFillVmSrc]);
             console.log("search", vm);
           };*/
        scope.inputChanged = function () {
            // console.log("input! value:", scope.searchModel);
            if (!targetArr.length) map();
            searchByModel();
            vm.seachModel = scope.seachModel;
            //console.log("input! value:", scope.outputs);
        };
        scope.activateSeachOutput = function (val) {
            // console.log("input! value:", val);
            scope.seachModel = val;
            vm.seachModel = val;
            element.find("input")[0].value = val.name;
            scope.outputs = [];
            //console.log("input! value:", element.find("input"));
        };

        /*
         * Search function
         * If the keys are an array find each
         */
        function map() {

            //console.log(keys, keys instanceof Array)
            if (keys instanceof Array) {
                for (var i = 0; i < keys.length; i++) {
                    // console.log("keys",keys[i]);
                    recursion(vm[attrs.autoFillVmSrc], keys[i]);
                }
            } else recursion(vm[attrs.autoFillVmSrc], keys);

            /*
             * Recursion function
             */
            function recursion(arr, prop) {
                if (arr instanceof Array) {

                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i] instanceof Object) {
                            //layers.push(i);
                            recursion(arr[i], prop);
                        } else if (arr[i][prop]) {
                            //layers.push(i);
                            targetArr.push({
                                name: arr[i][prop],
                                class: arr[i]._id
                            });
                            // console.log("key found", targetArr[i],arr[i])
                        }
                    }
                } else if (arr instanceof Object) {
                        for (var key in arr) {
                            if (key === prop) {

                                targetArr.push({
                                    name: arr[prop],
                                    class: arr._id
                                });
                                //console.log("key found", key)
                            }
                            if (arr[key] instanceof Array) {
                                //layers.push(key);
                                recursion(arr[key], prop);
                            }
                        }
                    }
            }
        }

        //user activated search
        //searchModel now has new val

        function searchByModel() {
            if (!scope.searchModel.length) {
                scope.outputsActive = false;
                return;
            }
            scope.outputs = [];

            // console.log(element.find("div"))
            findTarget();
            formatTarget();
            function findTarget() {
                for (var i = 0; i < targetArr.length; i++) {
                    if (findSimple(targetArr[i]) > -1) scope.outputs.push(targetArr[i]);
                    if (scope.outputs.length >= 10) return;
                }
            }
            function formatTarget() {
                targetArr.sort(function (a, b) {
                    return findSimple(a) - findSimple(b);
                });
            }
            function findSimple(a) {
                return a.name.toLowerCase().indexOf(scope.searchModel.toLowerCase());
            }
        }
    }
}
"use strict";

/**
* Data Factory
* @desc communicates with the api, returns promises of data
*/

angular.module(APPNAME).factory("dataFact", dataFact);

function dataFact(httpFact, $q, $timeout) {

    //this
    var dataF = {};

    //is this initalized?
    dataF.init;
    //2 possibilities
    //1: .init gets called
    //2. single schedule gets called

    //data we're serving
    dataF.campuses = [];
    dataF.weeks = [];

    //used to parse the week num
    var date = new Date();

    //check these in getters
    //if data not yet loaded from API ()=> that's a paddlin'
    var promises = {
        campuses: false,
        classes: false,
        weeks: false
    };

    //Public functions

    /*
     * Get campuses data from API
     */
    dataF.init = function () {
        dataF.init = true;
        console.log("Data factory initialized, getting data");
        httpFact.get("/campus").then(function (d) {
            dataF.campuses = d.data;
            promises.campuses = true;
            dataF.initClasses();
        }).catch(function (err) {
            console.warn("err@datafact campus", err);
        });
    };

    /*
    * Get classes data from API
     */
    dataF.initClasses = function () {

        //Async step func
        function step(i) {
            httpFact.get("/campus/" + encodeURI(dataF.campuses[i].name) + "/classes").then(function (d) {
                parseCampuses(d.data, "classes");
                if (i < dataF.campuses.length - 1) step(i += 1);else {
                    //Classes done
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
    dataF.initWeeks = function () {

        //Async step func
        function step(i) {
            httpFact.get("/campus/" + encodeURI(dataF.campuses[i].name) + "/weeks").then(function (d) {
                dataF.weeks.push(d.data);
                if (i < dataF.campuses.length - 1) step(i += 1);else {
                    //weeks done
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
    dataF.getWeekData = function (seachModel) {
        var promise = $q.defer();
        var w = new Date(date).getWeek();
        var target = undefined;
        //Weeks = all campuses all weeks
        for (var i = 0; i < dataF.weeks.length; i++) {
            //Weeks[i] = all weeks from 1 campus
            for (var j = 0; j < dataF.weeks[i].length; j++) {
                //Weeks[i][j] = data from 1 weeks from 1 campus
                //Has class:asdasd , weekNumber:49
                if (dataF.weeks[i][j].class === seachModel.class && dataF.weeks[i][j].weekNumber === w) {
                    // console.log("match!",dataF.weeks[i][j],w);
                    dataF.weeks[i][j].name = seachModel.name;

                    target = dataF.weeks[i][j];
                    //console.log(target);
                    break;
                }
            }
        }
        //Case where there is no week data
        if (!target) promise.reject("No schedule found");else {
            //get campus name
            dataF.campuses.forEach(function (el, i, a) {
                dataF.campuses[i].classes.forEach(function (eli, j, ar) {
                    //console.log(dataF.campuses[i].classes[j].name,dataF.campuses[i].classes[j]._id,target.class)
                    // console.log(dataF.campuses[i].classes[j]._id===target.class,dataF.campuses[i].classes[j]._id,target.class)
                    if (dataF.campuses[i].classes[j]._id === target.class) {
                        target.campus = dataF.campuses[i].name;
                        //  console.log(target);
                        promise.resolve(target);
                    }
                });
            });
        }
        return promise.promise;
    };

    /*
    * Campus | Class | Week
    * If data not yet loaded resolve, wait a sec, if still not reject
     */
    dataF.getCampus = function () {
        return $q(function (resolve, reject) {
            checkForStatusReturnPromise("campuses", "campuses", resolve, reject);
        });
    };
    dataF.getCampusData = function () {
        return $q(function (resolve, reject) {
            checkForStatusReturnPromise("classes", "campuses", resolve, reject);
        });
    };
    dataF.getCampusWeeks = function () {
        return $q(function (resolve, reject) {
            checkForStatusReturnPromise("weeks", "weeks", resolve, reject);
        });
    };

    /**
     * Return a week schedule
     * Note that we cant return something we don't have -> make sure we have the data first, then parse
     * @param currentByState - obj: week number, class name OPTIONAL class id
     * @return promise of data
     *
     */
    dataF.getSchedule = function (currentByState) {
        return $q(function (resolve, reject) {

            var returnVal = undefined;
            if (promises.weeks) mainLoop();else {
                $timeout(function () {
                    if (promises.weeks) mainLoop();else reject("API unavailable at this time, so sorry");
                }, 5000);
            }

            function mainLoop() {
                if (!currentByState.classId) getClassData();
                console.log(currentByState);
                resolve(getWeekDataSchedule());
            }

            //private mapping function, find class id by name
            function getClassData() {
                for (var i = 0; i < dataF.campuses.length; i++) {
                    for (var j = 0; j < dataF.campuses[i].classes.length; j++) {
                        if (dataF.campuses[i].classes[j].name === currentByState.name) {
                            currentByState.classId = dataF.campuses[i].classes[j]._id;
                            return;
                        }
                    }
                }
            }
        });
    };
    dataF.getSingleSchedule = function (sch) {
        return $q(function (resolve, reject) {
            console.log(sch);
            var returnVal = undefined;
            if (promises.weeks) resolve(getWeekDataSchedule(sch));else {
                httpFact.get("/campus/" + encodeURI(sch.campus) + "/classes/" + sch.class + "/" + sch.weekNumber).then(function (d) {
                    console.log(d);
                    // dataF.init();

                    resolve(d.data);
                }).catch(function (err) {
                    console.log(err);
                    reject(err);
                });
            }
        });
    };

    //Private

    /**
     * Parse week from desired params
     * @param currentByState:classId,currentByState.name
     * @returns schedule obj
     */
    function getWeekDataSchedule(currentByState) {

        getClassData();
        function getClassData() {
            for (var i = 0; i < dataF.campuses.length; i++) {
                for (var j = 0; j < dataF.campuses[i].classes.length; j++) {
                    if (dataF.campuses[i].classes[j].name === currentByState.class) {
                        currentByState.classId = dataF.campuses[i].classes[j]._id;
                        return;
                    }
                }
            }
        }
        console.log(currentByState);
        // console.log(dataF.weeks);
        for (var i = 0; i < dataF.weeks.length; i++) {
            for (var j = 0; j < dataF.weeks[i].length; j++) {
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
    function checkForStatusReturnPromise(p, data, resolve, reject) {
        if (promises[p]) resolve(dataF[data]);else {
            (function () {
                var timeOut = function timeOut(i) {
                    $timeout(function () {
                        // console.log(campuses);
                        if (promises[p]) resolve(dataF[data]);else if (i < 10) timeOut(++i);else reject("API unavailable at this time, so sorry");
                    }, 500);
                };

                timeOut(0);
            })();
        }
    }

    /*
    * Assign a campus it's classes
     */
    function parseCampuses(data, k) {
        // console.log(data);
        for (var j = 0; j < dataF.campuses.length; j++) {
            if (dataF.campuses[j]._id === data[0].campus) {
                dataF.campuses[j][k] = data;
            }
        }
    }

    dataF.init(); //singletons <3
    return dataF;
}

dataFact.$inject = ["httpFact", "$q", "$timeout"];
"use strict";

/*
* Find Controller
*/

angular.module(APPNAME).controller("findCtrl", findCtrl);

findCtrl.$inject = ["dataFact", "scheduleFact", "$state"];

function findCtrl(dataFact, scheduleFact, $state) {

    //this
    var vm = this;
    vm.date = new Date();
    vm.seachModel = {};
    //INIT
    //get campus & classes data
    (function () {
        dataFact.getCampusData().then(function (data) {
            console.log("AUTOFILL WORKS");
            vm.campuses = data;
        }).catch(function (err) {
            console.error(err);
        });
    })();

    //Event listeners
    //THE FIND ACTION
    vm.findSchedule = function () {
        if (!vm.seachModel.class) return err("No class specified");
        console.log(vm.seachModel);
        //Find week and set as active
        dataFact.getWeekData(vm.seachModel).then(function (w) {
            console.log(w);
            scheduleFact.setSchedule(w);
            //goto
            $state.go("schedule.campus.class.week", {
                campus: encodeURI(w.campus),
                cName: encodeURI(w.name),
                wn: encodeURI(w.weekNumber)
            });
        }).catch(function (noScheduleFoundError) {
            err("No schedule found");
        });

        function err(s) {
            console.log(s);
        }
    };
}
"use strict";

/**
* Http factory
* @desc communicates with the API
*/
angular.module(APPNAME).factory("httpFact", httpFact);

httpFact.$inject = ["$http"];

function httpFact($http) {

    var httpF = {};

    var apiAddr = "/api";

    //public
    /*
    * A simple get function
    * @param route String
     */
    httpF.get = function (route) {
        return $http.get(apiAddr + route);
    };

    return httpF;
}
"use strict";

/*
*   Schedules Controller
*/

/**
* TODO
*   Set the height of the colums based on duration
*   Also this is required for the text
*   Seems like we cant use the ng-material grid, these columns need to flow
*   
*/

angular.module(APPNAME).controller("scheduleCtrl", scheduleCtrl);

scheduleCtrl.$inject = ["scheduleFact"];

function scheduleCtrl(scheduleFact) {

    //this
    var vm = this;

    vm.dayNum = 8;
    vm.loading = true;

    //get this schedule from fact
    var test = new Date();
    console.log(test.getSeconds());
    scheduleFact.getSchedule().then(function (data) {
        console.log(test.getSeconds());
        vm.loading = false;
        if (data) {
            data.schedule = parseSchedules(data.schedule);
            vm.scheduleItem = data;
            console.log(vm.scheduleItem);
        } else {
            vm.noData = true;
        }
    });

    //parse schedule arr to moar suitable form
    function parseSchedules(d) {
        for (var i = 0; i < d.length; i++) {
            for (var j = 0; j < d[i].slots.length; j++) {
                d[i].slots[j].text = d[i].slots[j].text.replace(/\s*@br@\s*/gi, "<br>");
            }
        }
        return d;
    }
}
"use strict";

/**
 * Schedule factory
 * @desc store schedule data, get one if not exits
 */
angular.module(APPNAME).factory("scheduleFact", scheduleFact);

scheduleFact.$inject = ["$stateParams", "dataFact", "$q"];

function scheduleFact($stateParams, dataFact, $q) {

    //this
    var schedule = {};

    //the one we're serving to the controller
    var activeSchedule = {
        weekNumber: null,
        name: null
    };

    var currentByState = {};

    //are we sure that the schedule is the right one?
    var complete = undefined;

    //Private functions

    /**
    * Parse state params - do they match the schedule we have?
    * If !match || we don't have a schedule
    *   Get the correct one for datafact according to stateparams
     */
    function parseState() {
        currentByState.weekNumber = $stateParams.wn;
        currentByState.class = $stateParams.cName;
        currentByState.campus = $stateParams.campus;
        if (currentByState.weekNumber === activeSchedule.weekNumber && currentByState.name === activeSchedule.name) complete = true;
        /*        else dataFact.getSchedule(currentByState).then((data)=>{
        
                });*/
    }

    //Public functions

    //Setters & Getters
    /**
     *
     * @param obj
     */
    schedule.setSchedule = function (obj) {
        activeSchedule = obj;
    };

    /**
     *@desc Get the schedule we're using
     * @return promise, then the data
     *  if we don't have it we'll have to parse it from stateparams
     *      and the get if from the data facotry
     */
    schedule.getSchedule = function () {
        return $q(function (resolve, reject) {

            parseState();
            if (complete) resolve(activeSchedule);else {
                dataFact.getSingleSchedule(currentByState).then(function (sch) {
                    console.log("dataFact get schedule res", sch);
                    schedule.setSchedule(sch);
                    resolve(sch);
                }).catch(function (err) {
                    reject(err);
                });
                /*  dataFact.getSchedule(currentByState).then((sch)=>{
                      schedule.setSchedule(sch);
                      resolve(activeSchedule);
                  })
                  .catch((err)=>{
                      resolve(err)
                  })*/
            }
        });
    };

    return schedule;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFwcC5taW4uanMiLCJjb25maWcuanMiLCJhdXRvZmlsbC9hdXRvRmlsbC5qcyIsImRhdGEvZGF0YUZhY3QuanMiLCJmaW5kL2ZpbmRDdHJsLmpzIiwiSHR0cC9odHRwRmFjdC5qcyIsInNjaGVkdWxlL3NjaGVkdWxlQ3RybC5qcyIsInNjaGVkdWxlL3NjaGVkdWxlRmFjdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFJQSxJQUFJLE9BQU8sR0FBRyxTQUFTLENBQUM7O0FBRXhCLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsV0FBVyxFQUFDLFlBQVksRUFBQyxZQUFZLENBQUMsQ0FBQzs7Ozs7QUFBQyxBQUtqRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxZQUFXO0FBQ2hDLFFBQUksTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDaEQsV0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQUFBQyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUEsR0FBSSxRQUFRLEdBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQSxHQUFJLENBQUMsQ0FBQyxDQUFDO0NBQzlFLENBQUM7QUNkRjs7Ozs7O0FDR0EsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2hELE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDOztBQUUxRCxTQUFTLE1BQU0sQ0FBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUM7QUFDbkQsYUFBWSxDQUFDOztBQUNiLG1CQUFrQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyQyxLQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDZixlQUFj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TSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7QUFDNUMsWUFBRyxjQUFjLENBQUMsVUFBVSxLQUFHLGNBQWMsQ0FBQyxVQUFVLElBQUUsY0FBYyxDQUFDLElBQUksS0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsR0FBRyxJQUFJLENBQUM7Ozs7QUFBQSxLQUl4SDs7Ozs7Ozs7O0FBQUEsQUFTRCxZQUFRLENBQUMsV0FBVyxHQUFHLFVBQVMsR0FBRyxFQUFDO0FBQ2hDLHNCQUFjLEdBQUcsR0FBRyxDQUFDO0tBQ3hCOzs7Ozs7OztBQUFDLEFBUUYsWUFBUSxDQUFDLFdBQVcsR0FBRyxZQUFVO0FBQzdCLGVBQU8sRUFBRSxDQUFDLFVBQUMsT0FBTyxFQUFDLE1BQU0sRUFBRzs7QUFFeEIsc0JBQVUsRUFBRSxDQUFDO0FBQ2IsZ0JBQUcsUUFBUSxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxLQUVqQztBQUNBLHdCQUFRLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsR0FBRyxFQUFHO0FBQ25ELDJCQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdDLDRCQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzFCLDJCQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7aUJBQ2YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFDLEdBQUcsRUFBRztBQUNaLDBCQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2YsQ0FBQzs7Ozs7Ozs7QUFBQyxhQVFOO1NBQ0osQ0FBQyxDQUFBO0tBRUwsQ0FBQzs7QUFJTCxXQUFPLFFBQVEsQ0FBQztDQUNoQiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuKiBBbmd1bGFyIG1vZHVsZVxuKi9cblxudmFyIEFQUE5BTUUgPSBcImx1a2thcmlcIjtcblxuYW5ndWxhci5tb2R1bGUoQVBQTkFNRSwgWyd1aS5yb3V0ZXInLCduZ01hdGVyaWFsJywnbmdTYW5pdGl6ZSddKTtcblxuLypcbiogVXRpbGl0eVxuICovXG5EYXRlLnByb3RvdHlwZS5nZXRXZWVrID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IG9uZWphbiA9IG5ldyBEYXRlKHRoaXMuZ2V0RnVsbFllYXIoKSwgMCwgMSk7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgoKCh0aGlzIC0gb25lamFuKSAvIDg2NDAwMDAwKSArIG9uZWphbi5nZXREYXkoKSArIDEpIC8gNyk7XG59OyAiLCIiLCIvKlxyXG4qXHRVSSBSb3V0ZXNcclxuKi9cclxuYW5ndWxhci5tb2R1bGUoQVBQTkFNRSkuY29uZmlnKHN0YXRlcyxcInN0YXRlc1wiKTtcclxuc3RhdGVzLiRpbmplY3QgPSBbJyRzdGF0ZVByb3ZpZGVyJywgJyR1cmxSb3V0ZXJQcm92aWRlciddO1xyXG5cclxuZnVuY3Rpb24gc3RhdGVzICgkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKXtcclxuXHRcInVzZSBzdHJpY3RcIjtcclxuXHQkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwiZmluZFwiKTtcclxuXHR2YXIgcm91dGUgPSBcIlwiO1xyXG5cdCRzdGF0ZVByb3ZpZGVyIFxyXG5cdC5zdGF0ZShcImZpbmRcIix7XHJcblx0IFx0dXJsOlwiL2ZpbmRcIiwgXHJcblx0IFx0dGVtcGxhdGVVcmw6IFwiL2FwcC9maW5kL2ZpbmQuaHRtbFwiXHJcblx0fSkgXHJcblx0LnN0YXRlKFwic2NoZWR1bGVcIix7XHJcblx0IFx0dXJsOnJvdXRlK1wiL3NjaGVkdWxlXCIsXHJcblx0IFx0dGVtcGxhdGVVcmw6IFwiL2FwcC9zY2hlZHVsZS9zY2hlZHVsZS5odG1sXCJcclxuXHR9KVxyXG5cdFx0LnN0YXRlKFwic2NoZWR1bGUuY2FtcHVzXCIse1xyXG5cdFx0XHR1cmw6cm91dGUrXCIvOmNhbXB1c1wiLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogXCIvYXBwL3NjaGVkdWxlL3NjaGVkdWxlLmh0bWxcIiBcclxuXHRcdH0pXHJcblx0XHRcdC5zdGF0ZShcInNjaGVkdWxlLmNsYXNzXCIse1xyXG5cdFx0XHRcdHVybDpyb3V0ZStcIi86Y05hbWVcIixcclxuXHRcdFx0XHR0ZW1wbGF0ZVVybDogXCIvYXBwL3NjaGVkdWxlL3NjaGVkdWxlLmh0bWxcIlxyXG5cdFx0XHR9KVxyXG5cdFx0XHRcdC5zdGF0ZShcInNjaGVkdWxlLmNsYXNzLndlZWtcIix7XHJcblx0XHRcdFx0XHR1cmw6cm91dGUrXCIvOnduXCIsXHJcblx0XHRcdFx0XHR0ZW1wbGF0ZVVybDpcIi9hcHAvc2NoZWR1bGUvc2NoZWR1bGUuaHRtbFwiXHJcblx0XHRcdFx0fSlcclxuXHJcblx0XHRcdC5zdGF0ZShcInNjaGVkdWxlLmNhbXB1cy5jbGFzc1wiLHtcclxuXHRcdFx0XHR1cmw6cm91dGUrXCIvOmNOYW1lXCIsXHJcblx0XHRcdFx0dGVtcGxhdGVVcmw6IFwiL2FwcC9zY2hlZHVsZS9zY2hlZHVsZS5odG1sXCJcclxuXHRcdFx0fSlcclxuXHRcdFx0XHQuc3RhdGUoXCJzY2hlZHVsZS5jYW1wdXMuY2xhc3Mud2Vla1wiLHtcclxuXHRcdFx0XHRcdHVybDpyb3V0ZStcIi86d25cIixcclxuXHRcdFx0XHRcdHRlbXBsYXRlVXJsOiBcIi9hcHAvc2NoZWR1bGUvc2NoZWR1bGUuaHRtbFwiXHJcblx0XHRcdFx0fSlcclxufVxyXG4iLCJcclxuLyoqXHJcbiogQXV0byBmaWxsIHwgTm90ZSB0aGlzIGlzIHJlZHVuZGFudCBzaW5jZSB3ZSdyZSB1c2luZyBuZy1tYXRlcmlhbFxyXG4qIEBkZXNjICpBdXRvIGZpbGxzIHNlYXJjaGVzKlxyXG4qIEBwYXJhbTogYXV0by1maWxsLXZtOiB2bSB0byB0YXJnZXRcclxuKiBAcGFyYW06IGF1dG8tZmlsbC1zcmM6IGEgcHJvcGVydHkgb2Ygdm0gdG8gc2VhcmNoXHJcbiogQHBhcmFtOiBhdXRvLWZpbGwta2V5czoga2V5cyB0byBzZWFyY2ggaW4gc3JjIHwgc3RyaW5nIG9yIGFycmF5XHJcbiogQHBhcmFtOiBhdXRvLWZpbGwtY2I6IGZ1bmN0aW9uIHRvIGV4ZWN1dGUgb24gdXNlciBhY3Rpb24sIHBhc3NlZCB0aGUga2V5IGFuZCBpdCdzIHBhdGggZm91bmRcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmRpcmVjdGl2ZShcImF1dG9GaWxsXCIsYXV0b0ZpbGwpO1xyXG5cclxuYXV0b0ZpbGwuJGluamVjdCA9IFtcIiRjb21waWxlXCJdO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZpbGwoJGNvbXBpbGUpe1xyXG5cclxuXHRyZXR1cm57XHJcblx0XHRzY29wZTpcIj1cIixcclxuXHRcdGxpbms6bGlua0Z1bmMsXHJcblx0XHR0ZW1wbGF0ZTpcIlwiLFxyXG5cdFx0cmVzdHJpY3Q6XCJFXCJcclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiBsaW5rRnVuYyhzY29wZSxlbGVtZW50LGF0dHJzKSB7XHJcblxyXG4gICAgICAgIGxldCB2bSA9IHNjb3BlW2F0dHJzLmF1dG9GaWxsVm1dO1xyXG4gICAgICAgIGxldCBrZXlzO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBrZXlzWigpIHtcclxuICAgICAgICAgICAga2V5cyA9IGF0dHJzLmF1dG9GaWxsS2V5cy5zcGxpdChcIixcIik7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAga2V5c1ooKTtcclxuXHJcblxyXG5cclxuICAgICAgICAvL3Njb3BlLm91dHB1dHMgPVswLDAsMCwwLDAsMCwwLDAsMCwwXTtcclxuICAgICAgICAvLyBsZXQgc3JjID0gdm1bYXR0cnMuYXV0b0ZpbGxWbVNyY107XHJcbiAgICAgICAgLy8gbGV0IGNiID0gdm1bYXR0cnMuYXV0b0ZpbGxDYl07XHJcblxyXG4gICAgICAgIGxldCB0YXJnZXRBcnIgPSBbXTtcclxuICAgICAgICBzY29wZS5zZWFyY2hNb2RlbCA9IFtdO1xyXG4gICAgICAgIGlmICghdGFyZ2V0QXJyLmxlbmd0aCkgbWFwKCk7XHJcblxyXG4gICAgICAgIGxldCBpbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBsZXQgZWwgPSBcIjxkaXYgbmctY2xpY2s9J3NlYXJjaFRoaXMoKScgY2xhc3M9J3NlYXJjaCc+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8aW5wdXQgY2xhc3M9J2RhdGEtc2VhcmNoJyB0eXBlPSd0ZXh0JyBuZy1tb2RlbD0nc2VhcmNoTW9kZWwnIG5nLWNoYW5nZT0naW5wdXRDaGFuZ2VkKCknPlwiICtcclxuICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nc2VhcmNoLW91dHB1dCc+PGRpdiBjbGFzcz0naXRlbSBpdGVtLWxhYmVsIHNlYXJjaC1vdXRwdXQtc2luZ2xlJyBuZy1yZXBlYXQ9J3NlYXJjaE91dHB1dCBpbiBvdXRwdXRzIHRyYWNrIGJ5ICRpbmRleCcgPlwiICtcclxuICAgICAgICAgICAgICAgIFwiPHNwYW4gbmctY2xpY2s9J2FjdGl2YXRlU2VhY2hPdXRwdXQoc2VhcmNoT3V0cHV0KScgY2xhc3M9Jyc+e3tzZWFyY2hPdXRwdXQubmFtZX19PC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PlwiO1xyXG5cclxuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoZWwpKHNjb3BlKSlcclxuICAgICAgICB9KCk7XHJcblxyXG4gICAgICAgIC8vRXZlbnQgbGlzdGVuZXJzXHJcbiAgICAgICAvKiBzY29wZS5zZWFyY2hUaGlzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGF0dHJzLCBhdHRycy5hdXRvRmlsbFZtVGFyZ2V0KVxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHNyYyxhdHRycy5hdXRvRmlsbFZtU3JjLCB2bVthdHRycy5hdXRvRmlsbFZtU3JjXSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2VhcmNoXCIsIHZtKTtcclxuXHJcbiAgICAgICAgfTsqL1xyXG4gICAgICAgIHNjb3BlLmlucHV0Q2hhbmdlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImlucHV0ISB2YWx1ZTpcIiwgc2NvcGUuc2VhcmNoTW9kZWwpO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldEFyci5sZW5ndGgpIG1hcCgpO1xyXG4gICAgICAgICAgICBzZWFyY2hCeU1vZGVsKCk7XHJcbiAgICAgICAgICAgIHZtLnNlYWNoTW9kZWwgPSAgc2NvcGUuc2VhY2hNb2RlbDtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcImlucHV0ISB2YWx1ZTpcIiwgc2NvcGUub3V0cHV0cyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBzY29wZS5hY3RpdmF0ZVNlYWNoT3V0cHV0ID0gZnVuY3Rpb24odmFsKXtcclxuICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImlucHV0ISB2YWx1ZTpcIiwgdmFsKTtcclxuICAgICAgICAgICAgc2NvcGUuc2VhY2hNb2RlbCA9IHZhbDtcclxuICAgICAgICAgICAgdm0uc2VhY2hNb2RlbCA9IHZhbDtcclxuICAgICAgICAgICAgZWxlbWVudC5maW5kKFwiaW5wdXRcIilbMF0udmFsdWUgPSB2YWwubmFtZTtcclxuICAgICAgICAgICAgc2NvcGUub3V0cHV0cyA9IFtdO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5wdXQhIHZhbHVlOlwiLCBlbGVtZW50LmZpbmQoXCJpbnB1dFwiKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBTZWFyY2ggZnVuY3Rpb25cclxuICAgICAgICAgKiBJZiB0aGUga2V5cyBhcmUgYW4gYXJyYXkgZmluZCBlYWNoXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gbWFwKCkge1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhrZXlzLCBrZXlzIGluc3RhbmNlb2YgQXJyYXkpXHJcbiAgICAgICAgICAgIGlmIChrZXlzIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwia2V5c1wiLGtleXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlY3Vyc2lvbih2bVthdHRycy5hdXRvRmlsbFZtU3JjXSwga2V5c1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSByZWN1cnNpb24odm1bYXR0cnMuYXV0b0ZpbGxWbVNyY10sIGtleXMpO1xyXG5cclxuICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICogUmVjdXJzaW9uIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBmdW5jdGlvbiByZWN1cnNpb24oYXJyLCBwcm9wKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFycltpXSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYXllcnMucHVzaChpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2lvbihhcnJbaV0sIHByb3ApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFycltpXVtwcm9wXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYXllcnMucHVzaChpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEFyci5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOmFycltpXVtwcm9wXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzczphcnJbaV0uX2lkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwia2V5IGZvdW5kXCIsIHRhcmdldEFycltpXSxhcnJbaV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXJyIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGFycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBwcm9wKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0QXJyLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6YXJyW3Byb3BdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOmFyci5faWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcImtleSBmb3VuZFwiLCBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFycltrZXldIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbGF5ZXJzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2lvbihhcnJba2V5XSwgcHJvcClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy91c2VyIGFjdGl2YXRlZCBzZWFyY2hcclxuICAgICAgICAvL3NlYXJjaE1vZGVsIG5vdyBoYXMgbmV3IHZhbFxyXG5cclxuICAgICAgICBmdW5jdGlvbiBzZWFyY2hCeU1vZGVsKCkge1xyXG4gICAgICAgICAgICBpZiAoIXNjb3BlLnNlYXJjaE1vZGVsLmxlbmd0aCl7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5vdXRwdXRzQWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2NvcGUub3V0cHV0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlbGVtZW50LmZpbmQoXCJkaXZcIikpXHJcbiAgICAgICAgICAgIGZpbmRUYXJnZXQoKTtcclxuICAgICAgICAgICAgZm9ybWF0VGFyZ2V0KCk7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGZpbmRUYXJnZXQoKSB7XHJcbiAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPHRhcmdldEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihmaW5kU2ltcGxlKHRhcmdldEFycltpXSk+LTEpIHNjb3BlLm91dHB1dHMucHVzaCh0YXJnZXRBcnJbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHNjb3BlLm91dHB1dHMubGVuZ3RoID49MTApIHJldHVybjtcclxuICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnVuY3Rpb24gZm9ybWF0VGFyZ2V0KCl7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXRBcnIuc29ydChmdW5jdGlvbihhLGIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaW5kU2ltcGxlKGEpIC0gZmluZFNpbXBsZShiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnVuY3Rpb24gZmluZFNpbXBsZShhKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHNjb3BlLnNlYXJjaE1vZGVsLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHR9XHJcbn0iLCIvKipcclxuKiBEYXRhIEZhY3RvcnlcclxuKiBAZGVzYyBjb21tdW5pY2F0ZXMgd2l0aCB0aGUgYXBpLCByZXR1cm5zIHByb21pc2VzIG9mIGRhdGFcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmZhY3RvcnkoXCJkYXRhRmFjdFwiLGRhdGFGYWN0KTtcclxuXHJcblxyXG5mdW5jdGlvbiBkYXRhRmFjdChodHRwRmFjdCwgJHEsICR0aW1lb3V0KXtcclxuXHJcbiAgICAvL3RoaXNcclxuXHRsZXQgZGF0YUYgPSB7fTtcclxuXHJcbiAgICAvL2lzIHRoaXMgaW5pdGFsaXplZD9cclxuICAgIGRhdGFGLmluaXQ7XHJcbiAgICAvLzIgcG9zc2liaWxpdGllc1xyXG4gICAgLy8xOiAuaW5pdCBnZXRzIGNhbGxlZFxyXG4gICAgLy8yLiBzaW5nbGUgc2NoZWR1bGUgZ2V0cyBjYWxsZWRcclxuXHJcbiAgICAvL2RhdGEgd2UncmUgc2VydmluZ1xyXG4gICAgZGF0YUYuY2FtcHVzZXMgPSBbXTtcclxuICAgIGRhdGFGLndlZWtzID0gW107XHJcblxyXG4gICAgLy91c2VkIHRvIHBhcnNlIHRoZSB3ZWVrIG51bVxyXG4gICAgbGV0IGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgIC8vY2hlY2sgdGhlc2UgaW4gZ2V0dGVyc1xyXG4gICAgLy9pZiBkYXRhIG5vdCB5ZXQgbG9hZGVkIGZyb20gQVBJICgpPT4gdGhhdCdzIGEgcGFkZGxpbidcclxuICAgIGxldCBwcm9taXNlcyA9e1xyXG4gICAgICAgIGNhbXB1c2VzIDogZmFsc2UsXHJcbiAgICAgICAgY2xhc3NlcyA6IGZhbHNlLFxyXG4gICAgICAgIHdlZWtzOmZhbHNlXHJcbiAgICB9O1xyXG5cclxuICAgIC8vUHVibGljIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBHZXQgY2FtcHVzZXMgZGF0YSBmcm9tIEFQSVxyXG4gICAgICovXHJcbiAgICBkYXRhRi5pbml0ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICBkYXRhRi5pbml0ID0gdHJ1ZTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkRhdGEgZmFjdG9yeSBpbml0aWFsaXplZCwgZ2V0dGluZyBkYXRhXCIpXHJcbiAgICAgICAgaHR0cEZhY3QuZ2V0KFwiL2NhbXB1c1wiKS50aGVuKChkKT0+e1xyXG4gICAgICAgICAgICBkYXRhRi5jYW1wdXNlcyA9IGQuZGF0YTtcclxuICAgICAgICAgICAgcHJvbWlzZXMuY2FtcHVzZXMgPSB0cnVlO1xyXG4gICAgICAgICAgICBkYXRhRi5pbml0Q2xhc3NlcygpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKChlcnIpPT57XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImVyckBkYXRhZmFjdCBjYW1wdXNcIixlcnIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKlxyXG4gICAgKiBHZXQgY2xhc3NlcyBkYXRhIGZyb20gQVBJXHJcbiAgICAgKi9cclxuICAgIGRhdGFGLmluaXRDbGFzc2VzID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgLy9Bc3luYyBzdGVwIGZ1bmNcclxuICAgICAgICBmdW5jdGlvbiBzdGVwKGkpIHtcclxuICAgICAgICAgICAgaHR0cEZhY3QuZ2V0KFwiL2NhbXB1cy9cIiArIGVuY29kZVVSSShkYXRhRi5jYW1wdXNlc1tpXS5uYW1lKSArIFwiL2NsYXNzZXNcIikudGhlbigoZCk9PiB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZUNhbXB1c2VzKGQuZGF0YSwgXCJjbGFzc2VzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYoaTxkYXRhRi5jYW1wdXNlcy5sZW5ndGgtMSkgc3RlcChpKz0xKTtcclxuICAgICAgICAgICAgICAgIGVsc2V7ICAgLy9DbGFzc2VzIGRvbmVcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNsYXNzZXMgZG9uZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5jbGFzc2VzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhRi5pbml0V2Vla3MoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ZXAoMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBHZXQgd2Vla3MgZGF0YSBmcm9tIEFQSVxyXG4gICAgICovXHJcbiAgICBkYXRhRi5pbml0V2Vla3MgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAvL0FzeW5jIHN0ZXAgZnVuY1xyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAoaSkge1xyXG4gICAgICAgICAgICBodHRwRmFjdC5nZXQoXCIvY2FtcHVzL1wiICsgZW5jb2RlVVJJKGRhdGFGLmNhbXB1c2VzW2ldLm5hbWUpICsgXCIvd2Vla3NcIikudGhlbigoZCk9PiB7XHJcbiAgICAgICAgICAgICAgICBkYXRhRi53ZWVrcy5wdXNoKGQuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBpZihpPGRhdGFGLmNhbXB1c2VzLmxlbmd0aC0xKSBzdGVwKGkrPTEpO1xyXG4gICAgICAgICAgICAgICAgZWxzZXsgLy93ZWVrcyBkb25lXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMud2Vla3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwid2Vla3MgZG9uZVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ZXAoMCk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgLypcclxuICAgICBHZXR0ZXJzXHJcbiAgICAgKi9cclxuXHJcbiAgICAgLyoqXHJcbiAgICAgKiBQYXJzZSBhIHdlZWsncyBkYXRhIGJhc2VkIG9uIHNlbGVjdGVkIGRhdGUgJiBjbGFzcyBuYW1lXHJcbiAgICAgKiBAcGFyYW0gc2VhY2hNb2RlbCBvYmogLSAud2Vla051bWJlcjogLm5hbWU6IFxyXG4gICAgICovXHJcbiAgICBkYXRhRi5nZXRXZWVrRGF0YSA9IGZ1bmN0aW9uKHNlYWNoTW9kZWwpe1xyXG4gICAgICAgIHZhciBwcm9taXNlID0gJHEuZGVmZXIoKTtcclxuICAgICAgICBsZXQgdyA9IG5ldyBEYXRlKGRhdGUpLmdldFdlZWsoKTtcclxuICAgICAgICBsZXQgdGFyZ2V0O1xyXG4gICAgICAgIC8vV2Vla3MgPSBhbGwgY2FtcHVzZXMgYWxsIHdlZWtzXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPGRhdGFGLndlZWtzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAvL1dlZWtzW2ldID0gYWxsIHdlZWtzIGZyb20gMSBjYW1wdXNcclxuICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGRhdGFGLndlZWtzW2ldLmxlbmd0aDtqKyspeyBcclxuICAgICAgICAgICAgICAgIC8vV2Vla3NbaV1bal0gPSBkYXRhIGZyb20gMSB3ZWVrcyBmcm9tIDEgY2FtcHVzXHJcbiAgICAgICAgICAgICAgICAvL0hhcyBjbGFzczphc2Rhc2QgLCB3ZWVrTnVtYmVyOjQ5XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhRi53ZWVrc1tpXVtqXS5jbGFzcz09PXNlYWNoTW9kZWwuY2xhc3MmJmRhdGFGLndlZWtzW2ldW2pdLndlZWtOdW1iZXI9PT13KXtcclxuICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJtYXRjaCFcIixkYXRhRi53ZWVrc1tpXVtqXSx3KTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhRi53ZWVrc1tpXVtqXS5uYW1lID0gc2VhY2hNb2RlbC5uYW1lO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSBkYXRhRi53ZWVrc1tpXVtqXTtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy9DYXNlIHdoZXJlIHRoZXJlIGlzIG5vIHdlZWsgZGF0YVxyXG4gICAgICAgIGlmKCF0YXJnZXQpIHByb21pc2UucmVqZWN0KFwiTm8gc2NoZWR1bGUgZm91bmRcIik7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vZ2V0IGNhbXB1cyBuYW1lXHJcbiAgICAgICAgICAgIGRhdGFGLmNhbXB1c2VzLmZvckVhY2goKGVsLCBpLCBhKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhRi5jYW1wdXNlc1tpXS5jbGFzc2VzLmZvckVhY2goKGVsaSwgaiwgYXIpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGRhdGFGLmNhbXB1c2VzW2ldLmNsYXNzZXNbal0ubmFtZSxkYXRhRi5jYW1wdXNlc1tpXS5jbGFzc2VzW2pdLl9pZCx0YXJnZXQuY2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGFGLmNhbXB1c2VzW2ldLmNsYXNzZXNbal0uX2lkPT09dGFyZ2V0LmNsYXNzLGRhdGFGLmNhbXB1c2VzW2ldLmNsYXNzZXNbal0uX2lkLHRhcmdldC5jbGFzcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFGLmNhbXB1c2VzW2ldLmNsYXNzZXNbal0uX2lkID09PSB0YXJnZXQuY2xhc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5jYW1wdXMgPSBkYXRhRi5jYW1wdXNlc1tpXS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gIGNvbnNvbGUubG9nKHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlLnJlc29sdmUodGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwcm9taXNlLnByb21pc2U7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKlxyXG4gICAgKiBDYW1wdXMgfCBDbGFzcyB8IFdlZWtcclxuICAgICogSWYgZGF0YSBub3QgeWV0IGxvYWRlZCByZXNvbHZlLCB3YWl0IGEgc2VjLCBpZiBzdGlsbCBub3QgcmVqZWN0XHJcbiAgICAgKi9cclxuICAgIGRhdGFGLmdldENhbXB1cyA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuICRxKChyZXNvbHZlLCByZWplY3QpPT57XHJcbiAgICAgICAgICAgIGNoZWNrRm9yU3RhdHVzUmV0dXJuUHJvbWlzZShcImNhbXB1c2VzXCIsXCJjYW1wdXNlc1wiLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIGRhdGFGLmdldENhbXB1c0RhdGEgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiAkcSgocmVzb2x2ZSwgcmVqZWN0KT0+e1xyXG4gICAgICAgICAgICBjaGVja0ZvclN0YXR1c1JldHVyblByb21pc2UoXCJjbGFzc2VzXCIsXCJjYW1wdXNlc1wiLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIGRhdGFGLmdldENhbXB1c1dlZWtzID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUsIHJlamVjdCk9PntcclxuICAgICAgICAgICAgY2hlY2tGb3JTdGF0dXNSZXR1cm5Qcm9taXNlKFwid2Vla3NcIixcIndlZWtzXCIsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gYSB3ZWVrIHNjaGVkdWxlXHJcbiAgICAgKiBOb3RlIHRoYXQgd2UgY2FudCByZXR1cm4gc29tZXRoaW5nIHdlIGRvbid0IGhhdmUgLT4gbWFrZSBzdXJlIHdlIGhhdmUgdGhlIGRhdGEgZmlyc3QsIHRoZW4gcGFyc2VcclxuICAgICAqIEBwYXJhbSBjdXJyZW50QnlTdGF0ZSAtIG9iajogd2VlayBudW1iZXIsIGNsYXNzIG5hbWUgT1BUSU9OQUwgY2xhc3MgaWRcclxuICAgICAqIEByZXR1cm4gcHJvbWlzZSBvZiBkYXRhXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICBkYXRhRi5nZXRTY2hlZHVsZSA9IGZ1bmN0aW9uKGN1cnJlbnRCeVN0YXRlKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUsIHJlamVjdCk9PntcclxuXHJcbiAgICAgICAgICAgIGxldCByZXR1cm5WYWw7XHJcbiAgICAgICAgICAgIGlmKHByb21pc2VzLndlZWtzKSBtYWluTG9vcCgpO1xyXG5cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICR0aW1lb3V0KCgpPT57XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocHJvbWlzZXMud2Vla3MpIG1haW5Mb29wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZWplY3QoXCJBUEkgdW5hdmFpbGFibGUgYXQgdGhpcyB0aW1lLCBzbyBzb3JyeVwiKVxyXG4gICAgICAgICAgICAgICAgfSw1MDAwKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiBtYWluTG9vcCgpe1xyXG4gICAgICAgICAgICAgICAgaWYoIWN1cnJlbnRCeVN0YXRlLmNsYXNzSWQpIGdldENsYXNzRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coY3VycmVudEJ5U3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShnZXRXZWVrRGF0YVNjaGVkdWxlKCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL3ByaXZhdGUgbWFwcGluZyBmdW5jdGlvbiwgZmluZCBjbGFzcyBpZCBieSBuYW1lXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldENsYXNzRGF0YSgpe1xyXG4gICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPCBkYXRhRi5jYW1wdXNlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZGF0YUYuY2FtcHVzZXNbaV0uY2xhc3Nlcy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFGLmNhbXB1c2VzW2ldLmNsYXNzZXNbal0ubmFtZSA9PT0gY3VycmVudEJ5U3RhdGUubmFtZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50QnlTdGF0ZS5jbGFzc0lkID0gZGF0YUYuY2FtcHVzZXNbaV0uY2xhc3Nlc1tqXS5faWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBkYXRhRi5nZXRTaW5nbGVTY2hlZHVsZSA9IGZ1bmN0aW9uKHNjaCl7XHJcbiAgICAgICAgcmV0dXJuICRxKChyZXNvbHZlLCByZWplY3QpPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzY2gpXHJcbiAgICAgICAgICAgIGxldCByZXR1cm5WYWw7XHJcbiAgICAgICAgICAgIGlmIChwcm9taXNlcy53ZWVrcykgcmVzb2x2ZShnZXRXZWVrRGF0YVNjaGVkdWxlKHNjaCkpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGh0dHBGYWN0LmdldChcIi9jYW1wdXMvXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSShzY2guY2FtcHVzKSArXHJcbiAgICAgICAgICAgICAgICAgICAgXCIvY2xhc3Nlcy9cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgc2NoLmNsYXNzICsgXCIvXCIrXHJcbiAgICAgICAgICAgICAgICAgICAgc2NoLndlZWtOdW1iZXJcclxuICAgICAgICAgICAgICAgICkudGhlbigoZCk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZCk7XHJcbiAgICAgICAgICAgICAgICAgICAvLyBkYXRhRi5pbml0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZC5kYXRhKTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgLy9Qcml2YXRlXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZSB3ZWVrIGZyb20gZGVzaXJlZCBwYXJhbXNcclxuICAgICAqIEBwYXJhbSBjdXJyZW50QnlTdGF0ZTpjbGFzc0lkLGN1cnJlbnRCeVN0YXRlLm5hbWVcclxuICAgICAqIEByZXR1cm5zIHNjaGVkdWxlIG9ialxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXRXZWVrRGF0YVNjaGVkdWxlKGN1cnJlbnRCeVN0YXRlKXtcclxuXHJcbiAgICAgICAgZ2V0Q2xhc3NEYXRhKCk7XHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2xhc3NEYXRhKCl7XHJcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7aTwgZGF0YUYuY2FtcHVzZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZGF0YUYuY2FtcHVzZXNbaV0uY2xhc3Nlcy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YUYuY2FtcHVzZXNbaV0uY2xhc3Nlc1tqXS5uYW1lID09PSBjdXJyZW50QnlTdGF0ZS5jbGFzcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRCeVN0YXRlLmNsYXNzSWQgPSBkYXRhRi5jYW1wdXNlc1tpXS5jbGFzc2VzW2pdLl9pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyhjdXJyZW50QnlTdGF0ZSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YUYud2Vla3MpO1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTxkYXRhRi53ZWVrcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGRhdGFGLndlZWtzW2ldLmxlbmd0aDtqKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhRi53ZWVrc1tpXVtqXS5jbGFzcyA9PT0gY3VycmVudEJ5U3RhdGUuY2xhc3NJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFGLndlZWtzW2ldW2pdLm5hbWUgPSBjdXJyZW50QnlTdGF0ZS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhRi53ZWVrc1tpXVtqXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qXHJcbiAgICAqIElmIGRhdGEgbm90IHlldCBsb2FkZWQgcmVzb2x2ZSwgd2FpdCBhIHNlYywgaWYgc3RpbGwgbm90IHJlamVjdFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclN0YXR1c1JldHVyblByb21pc2UocCwgZGF0YSwgcmVzb2x2ZSwgcmVqZWN0KXtcclxuICAgICAgICBpZihwcm9taXNlc1twXSkgcmVzb2x2ZShkYXRhRltkYXRhXSk7XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgdGltZU91dCgwKTtcclxuICAgICAgICAgICAgZnVuY3Rpb24gdGltZU91dChpKXtcclxuICAgICAgICAgICAgICAgICR0aW1lb3V0KCgpPT57ICAvLyBjb25zb2xlLmxvZyhjYW1wdXNlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocHJvbWlzZXNbcF0pIHJlc29sdmUoZGF0YUZbZGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYoaTwxMCkgdGltZU91dCgrK2kpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgIHJlamVjdChcIkFQSSB1bmF2YWlsYWJsZSBhdCB0aGlzIHRpbWUsIHNvIHNvcnJ5XCIpO1xyXG4gICAgICAgICAgICAgICAgfSw1MDApXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICAqIEFzc2lnbiBhIGNhbXB1cyBpdCdzIGNsYXNzZXNcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcGFyc2VDYW1wdXNlcyhkYXRhLCBrKXtcclxuICAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgIGZvcihsZXQgaiA9IDA7ajxkYXRhRi5jYW1wdXNlcy5sZW5ndGg7aisrKXsgXHJcbiAgICAgICAgICAgIGlmKGRhdGFGLmNhbXB1c2VzW2pdLl9pZCA9PT0gZGF0YVswXS5jYW1wdXMpe1xyXG4gICAgICAgICAgICAgICAgZGF0YUYuY2FtcHVzZXNbal1ba10gPSBkYXRhO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRhdGFGLmluaXQoKTsgLy9zaW5nbGV0b25zIDwzXHJcblx0cmV0dXJuIGRhdGFGO1xyXG59XHJcblxyXG5cclxuZGF0YUZhY3QuJGluamVjdCA9IFtcImh0dHBGYWN0XCIsIFwiJHFcIiwgXCIkdGltZW91dFwiXTtcclxuIiwiLypcclxuKiBGaW5kIENvbnRyb2xsZXJcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmNvbnRyb2xsZXIoXCJmaW5kQ3RybFwiLGZpbmRDdHJsKTtcclxuXHJcbmZpbmRDdHJsLiRpbmplY3QgPSBbXCJkYXRhRmFjdFwiLFwic2NoZWR1bGVGYWN0XCIsIFwiJHN0YXRlXCJdO1xyXG5cclxuZnVuY3Rpb24gZmluZEN0cmwoZGF0YUZhY3Qsc2NoZWR1bGVGYWN0LCAkc3RhdGUpe1xyXG5cclxuICAgIC8vdGhpc1xyXG4gICAgbGV0IHZtID0gdGhpcztcclxuICAgIHZtLmRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgdm0uc2VhY2hNb2RlbCA9IHt9O1xyXG4gICAgLy9JTklUXHJcbiAgICAvL2dldCBjYW1wdXMgJiBjbGFzc2VzIGRhdGFcclxuICAgIChmdW5jdGlvbigpe1xyXG4gICAgICAgIGRhdGFGYWN0LmdldENhbXB1c0RhdGEoKS50aGVuKChkYXRhKT0+e1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFVVE9GSUxMIFdPUktTXCIpXHJcbiAgICAgICAgICAgIHZtLmNhbXB1c2VzID0gZGF0YTtcclxuXHJcbiAgICAgICAgfSkuY2F0Y2goKGVycik9PntcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSkoKTtcclxuXHJcbiAgICAvL0V2ZW50IGxpc3RlbmVyc1xyXG4gICAgLy9USEUgRklORCBBQ1RJT05cclxuICAgIHZtLmZpbmRTY2hlZHVsZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgaWYoIXZtLnNlYWNoTW9kZWwuY2xhc3MpIHJldHVybiBlcnIoXCJObyBjbGFzcyBzcGVjaWZpZWRcIik7XHJcbiAgICAgICAgY29uc29sZS5sb2codm0uc2VhY2hNb2RlbCk7XHJcbiAgICAgICAgLy9GaW5kIHdlZWsgYW5kIHNldCBhcyBhY3RpdmVcclxuICAgICAgICBkYXRhRmFjdC5nZXRXZWVrRGF0YSh2bS5zZWFjaE1vZGVsKVxyXG4gICAgICAgICAgICAudGhlbigodyk9PntcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHcpO1xyXG4gICAgICAgICAgICAgICAgc2NoZWR1bGVGYWN0LnNldFNjaGVkdWxlKHcpO1xyXG4gICAgICAgICAgICAgICAgLy9nb3RvXHJcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oXCJzY2hlZHVsZS5jYW1wdXMuY2xhc3Mud2Vla1wiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FtcHVzOmVuY29kZVVSSSh3LmNhbXB1cyksXHJcbiAgICAgICAgICAgICAgICAgICAgY05hbWU6ZW5jb2RlVVJJKHcubmFtZSksXHJcbiAgICAgICAgICAgICAgICAgICAgd246ZW5jb2RlVVJJKHcud2Vla051bWJlcilcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgobm9TY2hlZHVsZUZvdW5kRXJyb3IpPT57XHJcbiAgICAgICAgICAgIGVycihcIk5vIHNjaGVkdWxlIGZvdW5kXCIpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBlcnIocyl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHMpXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn1cclxuXHJcblxyXG4iLCIvKipcclxuKiBIdHRwIGZhY3RvcnlcclxuKiBAZGVzYyBjb21tdW5pY2F0ZXMgd2l0aCB0aGUgQVBJXHJcbiovXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmZhY3RvcnkoXCJodHRwRmFjdFwiLGh0dHBGYWN0KTtcclxuXHJcbmh0dHBGYWN0LiRpbmplY3QgPSBbXCIkaHR0cFwiXTtcclxuXHJcbmZ1bmN0aW9uIGh0dHBGYWN0KCRodHRwKXtcclxuXHJcbiAgICBsZXQgaHR0cEYgPSB7fTtcclxuXHJcbiAgICBsZXQgYXBpQWRkciA9IFwiL2FwaVwiO1xyXG5cclxuICAgIC8vcHVibGljXHJcbiAgICAvKlxyXG4gICAgKiBBIHNpbXBsZSBnZXQgZnVuY3Rpb25cclxuICAgICogQHBhcmFtIHJvdXRlIFN0cmluZ1xyXG4gICAgICovXHJcbiAgICBodHRwRi5nZXQgPSBmdW5jdGlvbihyb3V0ZSl7XHJcbiAgICAgICAgcmV0dXJuICRodHRwLmdldChhcGlBZGRyK3JvdXRlKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGh0dHBGO1xyXG59XHJcblxyXG5cclxuIiwiLypcclxuKiAgIFNjaGVkdWxlcyBDb250cm9sbGVyXHJcbiovXHJcblxyXG4vKipcclxuKiBUT0RPXHJcbiogICBTZXQgdGhlIGhlaWdodCBvZiB0aGUgY29sdW1zIGJhc2VkIG9uIGR1cmF0aW9uXHJcbiogICBBbHNvIHRoaXMgaXMgcmVxdWlyZWQgZm9yIHRoZSB0ZXh0XHJcbiogICBTZWVtcyBsaWtlIHdlIGNhbnQgdXNlIHRoZSBuZy1tYXRlcmlhbCBncmlkLCB0aGVzZSBjb2x1bW5zIG5lZWQgdG8gZmxvd1xyXG4qICAgXHJcbiovXHJcblxyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FKS5jb250cm9sbGVyKFwic2NoZWR1bGVDdHJsXCIsc2NoZWR1bGVDdHJsKTtcclxuXHJcbnNjaGVkdWxlQ3RybC4kaW5qZWN0ID0gW1wic2NoZWR1bGVGYWN0XCJdO1xyXG5cclxuZnVuY3Rpb24gc2NoZWR1bGVDdHJsKHNjaGVkdWxlRmFjdCl7XHJcblxyXG4gICAgLy90aGlzXHJcbiAgICBsZXQgdm0gPSB0aGlzO1xyXG5cclxuICAgIHZtLmRheU51bSA9IDg7XHJcbiAgICB2bS5sb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAvL2dldCB0aGlzIHNjaGVkdWxlIGZyb20gZmFjdFxyXG4gICAgbGV0IHRlc3QgPSBuZXcgRGF0ZSgpO1xyXG4gICAgY29uc29sZS5sb2codGVzdC5nZXRTZWNvbmRzKCkpXHJcbiAgICBzY2hlZHVsZUZhY3QuZ2V0U2NoZWR1bGUoKS50aGVuKChkYXRhKT0+e1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRlc3QuZ2V0U2Vjb25kcygpKVxyXG4gICAgICAgIHZtLmxvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICBpZihkYXRhKXtcclxuICAgICAgICAgICAgZGF0YS5zY2hlZHVsZSA9IHBhcnNlU2NoZWR1bGVzKGRhdGEuc2NoZWR1bGUpO1xyXG4gICAgICAgICAgICB2bS5zY2hlZHVsZUl0ZW0gPWRhdGE7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHZtLnNjaGVkdWxlSXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHZtLm5vRGF0YT10cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL3BhcnNlIHNjaGVkdWxlIGFyciB0byBtb2FyIHN1aXRhYmxlIGZvcm1cclxuICAgIGZ1bmN0aW9uIHBhcnNlU2NoZWR1bGVzKGQpe1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTxkLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZFtpXS5zbG90cy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICBkW2ldLnNsb3RzW2pdLnRleHQgPSBkW2ldLnNsb3RzW2pdLnRleHQucmVwbGFjZSgvXFxzKkBickBcXHMqL2dpLFwiPGJyPlwiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuIiwiLyoqXHJcbiAqIFNjaGVkdWxlIGZhY3RvcnlcclxuICogQGRlc2Mgc3RvcmUgc2NoZWR1bGUgZGF0YSwgZ2V0IG9uZSBpZiBub3QgZXhpdHNcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmZhY3RvcnkoXCJzY2hlZHVsZUZhY3RcIixzY2hlZHVsZUZhY3QpO1xyXG5cclxuc2NoZWR1bGVGYWN0LiRpbmplY3QgPSBbXCIkc3RhdGVQYXJhbXNcIiwgXCJkYXRhRmFjdFwiLCBcIiRxXCJdO1xyXG5cclxuZnVuY3Rpb24gc2NoZWR1bGVGYWN0KCRzdGF0ZVBhcmFtcywgZGF0YUZhY3QsICRxKXtcclxuXHJcbiAgICAvL3RoaXNcclxuXHRsZXQgc2NoZWR1bGUgPSB7fTtcclxuXHJcbiAgICAvL3RoZSBvbmUgd2UncmUgc2VydmluZyB0byB0aGUgY29udHJvbGxlclxyXG4gICAgbGV0IGFjdGl2ZVNjaGVkdWxlID17XHJcbiAgICAgICAgd2Vla051bWJlcjogbnVsbCxcclxuICAgICAgICBuYW1lOiBudWxsXHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBjdXJyZW50QnlTdGF0ZSA9IHt9O1xyXG5cclxuICAgIC8vYXJlIHdlIHN1cmUgdGhhdCB0aGUgc2NoZWR1bGUgaXMgdGhlIHJpZ2h0IG9uZT9cclxuICAgIGxldCBjb21wbGV0ZTtcclxuXHJcbiAgICAvL1ByaXZhdGUgZnVuY3Rpb25zXHJcblxyXG4gICAgLyoqXHJcbiAgICAqIFBhcnNlIHN0YXRlIHBhcmFtcyAtIGRvIHRoZXkgbWF0Y2ggdGhlIHNjaGVkdWxlIHdlIGhhdmU/XHJcbiAgICAqIElmICFtYXRjaCB8fCB3ZSBkb24ndCBoYXZlIGEgc2NoZWR1bGVcclxuICAgICogICBHZXQgdGhlIGNvcnJlY3Qgb25lIGZvciBkYXRhZmFjdCBhY2NvcmRpbmcgdG8gc3RhdGVwYXJhbXNcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcGFyc2VTdGF0ZSgpIHtcclxuICAgICAgICBjdXJyZW50QnlTdGF0ZS53ZWVrTnVtYmVyID0gJHN0YXRlUGFyYW1zLnduO1xyXG4gICAgICAgIGN1cnJlbnRCeVN0YXRlLmNsYXNzID0gJHN0YXRlUGFyYW1zLmNOYW1lO1xyXG4gICAgICAgIGN1cnJlbnRCeVN0YXRlLmNhbXB1cyA9ICRzdGF0ZVBhcmFtcy5jYW1wdXM7XHJcbiAgICAgICAgaWYoY3VycmVudEJ5U3RhdGUud2Vla051bWJlcj09PWFjdGl2ZVNjaGVkdWxlLndlZWtOdW1iZXImJmN1cnJlbnRCeVN0YXRlLm5hbWU9PT1hY3RpdmVTY2hlZHVsZS5uYW1lKSBjb21wbGV0ZSA9IHRydWU7XHJcbi8qICAgICAgICBlbHNlIGRhdGFGYWN0LmdldFNjaGVkdWxlKGN1cnJlbnRCeVN0YXRlKS50aGVuKChkYXRhKT0+e1xyXG5cclxuICAgICAgICB9KTsqL1xyXG4gICAgfVxyXG5cclxuICAgIC8vUHVibGljIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8vU2V0dGVycyAmIEdldHRlcnNcclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBvYmpcclxuICAgICAqL1xyXG4gICAgc2NoZWR1bGUuc2V0U2NoZWR1bGUgPSBmdW5jdGlvbihvYmope1xyXG4gICAgICAgIGFjdGl2ZVNjaGVkdWxlID0gb2JqO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqQGRlc2MgR2V0IHRoZSBzY2hlZHVsZSB3ZSdyZSB1c2luZ1xyXG4gICAgICogQHJldHVybiBwcm9taXNlLCB0aGVuIHRoZSBkYXRhXHJcbiAgICAgKiAgaWYgd2UgZG9uJ3QgaGF2ZSBpdCB3ZSdsbCBoYXZlIHRvIHBhcnNlIGl0IGZyb20gc3RhdGVwYXJhbXNcclxuICAgICAqICAgICAgYW5kIHRoZSBnZXQgaWYgZnJvbSB0aGUgZGF0YSBmYWNvdHJ5XHJcbiAgICAgKi9cclxuICAgIHNjaGVkdWxlLmdldFNjaGVkdWxlID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUscmVqZWN0KT0+e1xyXG5cclxuICAgICAgICAgICAgcGFyc2VTdGF0ZSgpO1xyXG4gICAgICAgICAgICBpZihjb21wbGV0ZSkgcmVzb2x2ZShhY3RpdmVTY2hlZHVsZSk7XHJcblxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgZGF0YUZhY3QuZ2V0U2luZ2xlU2NoZWR1bGUoY3VycmVudEJ5U3RhdGUpLnRoZW4oKHNjaCk9PntcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImRhdGFGYWN0IGdldCBzY2hlZHVsZSByZXNcIixzY2gpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlLnNldFNjaGVkdWxlKHNjaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzY2gpXHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKT0+e1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgLyogIGRhdGFGYWN0LmdldFNjaGVkdWxlKGN1cnJlbnRCeVN0YXRlKS50aGVuKChzY2gpPT57XHJcbiAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGUuc2V0U2NoZWR1bGUoc2NoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFjdGl2ZVNjaGVkdWxlKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycik9PntcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGVycilcclxuICAgICAgICAgICAgICAgIH0pKi9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfTtcclxuXHJcblxyXG5cclxuXHRyZXR1cm4gc2NoZWR1bGU7XHJcbn1cclxuXHJcblxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
