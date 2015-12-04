'use strict';

/*
* Angular module
*/

var APPNAME = "lukkari";

angular.module(APPNAME, ['ui.router', 'ngMaterial']);

/*
* Utility
 */
Date.prototype.getWeek = function () {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil(((this - onejan) / 86400000 + onejan.getDay() + 1) / 7);
};
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

        var w = new Date(date).getWeek();

        //Weeks = all campuses all weeks
        for (var i = 0; i < dataF.weeks.length; i++) {
            //Weeks[i] = all weeks from 1 campus
            for (var j = 0; j < dataF.weeks[i].length; j++) {
                //Weeks[i][j] = data from 1 weeks from 1 campus
                //Has class:asdasd , weekNumber:49
                if (dataF.weeks[i][j].class === seachModel.class && dataF.weeks[i][j].weekNumber === w) {
                    // console.log("match!",dataF.weeks[i][j],w);
                    dataF.weeks[i][j].name = seachModel.name;
                    console.log(dataF.weeks[i]);
                    return dataF.weeks[i][j];
                }
            }
        }
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

            function getWeekDataSchedule() {
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
        });
    };

    //Private
    /*
    * If data not yet loaded resolve, wait a sec, if still not reject
     */
    function checkForStatusReturnPromise(p, data, resolve, reject) {
        if (promises[p]) resolve(dataF[data]);else {
            $timeout(function () {
                // console.log(campuses);
                if (promises[p]) resolve(dataF[data]);else reject("API unavailable at this time, so sorry");
            }, 5000);
        }
    }

    /*
    * Assign a campus it's classes
     */
    function parseCampuses(data, k) {
        console.log(data);
        for (var j = 0; j < dataF.campuses.length; j++) {
            if (dataF.campuses[j]._id === data[0].campus) {
                dataF.campuses[j][k] = data;
            }
        }
    }

    dataF.init(); //singletons <3
    return dataF;
}

//dataFact.$inject = ["httpFact, $q, $timeout"];
"use strict";

/*
* Find Controller
*/

angular.module(APPNAME).controller("findCtrl", findCtrl);

//sfindCtrl.$inject = ["dataFact,scheduleFact, $state"];

function findCtrl(dataFact, scheduleFact, $state) {

    //this
    var vm = this;

    //INIT
    //get campus & classes data
    (function () {
        dataFact.getCampusData().then(function (data) {
            vm.campuses = data;
        }).catch(function (err) {
            console.error(err);
        });
    })();

    //Event listeners
    //THE FIND ACTION
    vm.findSchedule = function () {

        console.log(vm.seachModel);
        //Find week and set as active
        var w = dataFact.getWeekData(vm.seachModel);
        console.log(w);
        scheduleFact.setSchedule(w);
        //goto
        $state.go("schedule.class.week", {
            cName: encodeURI(w.name),
            wn: encodeURI(w.weekNumber)
        });
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

angular.module(APPNAME).controller("scheduleCtrl", scheduleCtrl);

scheduleCtrl.$inject = ["scheduleFact"];

function scheduleCtrl(scheduleFact) {

    //this
    var vm = this;

    //get this schedule from fact
    scheduleFact.getSchedule().then(function (data) {
        data.schedule = parseSchedules(data.schedule);
        vm.scheduleItem = data;
        console.log(vm.scheduleItem);
    });

    //parse schedule arr to moar suitable form
    function parseSchedules(d) {
        for (var i = 0; i < d.length; i++) {
            for (var j = 0; j < d[i].slots.length; j++) {
                //  d[i].slots[j].text = d[i].slots[j].text.replace(/\s*@br@\s*/gi,"&nbsp;")
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

//scheduleFact.$inject = ["$stateParams, dataFact, $q"];

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
        currentByState.name = $stateParams.cName;
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
                dataFact.getSchedule(currentByState).then(function (sch) {
                    schedule.setSchedule(sch);
                    resolve(activeSchedule);
                }).catch(function (err) {
                    resolve(err);
                });
            }
        });
    };

    return schedule;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbmZpZy5qcyIsImF1dG9maWxsL2F1dG9GaWxsLmpzIiwiZGF0YS9kYXRhRmFjdC5qcyIsImZpbmQvZmluZEN0cmwuanMiLCJIdHRwL2h0dHBGYWN0LmpzIiwic2NoZWR1bGUvc2NoZWR1bGVDdHJsLmpzIiwic2NoZWR1bGUvc2NoZWR1bGVGYWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUlBLElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQzs7QUFFeEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUMsWUFBWSxDQUFDLENBQUM7Ozs7O0FBQUMsQUFLcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsWUFBVztBQUNoQyxRQUFJLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hELFdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEFBQUMsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFBLEdBQUksUUFBUSxHQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUEsR0FBSSxDQUFDLENBQUMsQ0FBQztDQUM5RSxDQUFDOzs7Ozs7QUNYRixPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUMsUUFBUSxDQUFDLENBQUM7QUFDaEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLGdCQUFnQixFQUFFLG9CQUFvQixDQUFDLENBQUM7O0FBRTFELFNBQVMsTUFBTSxDQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBQztBQUNuRCxhQUFZLENBQUM7O0FBQ2IsbUJBQWtCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3JDLEtBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLGVBQWMsQ0FDYixLQUFLLENBQUMsTUFBTSxFQUFDO0FBQ1osS0FBRyxFQUFDLE9BQU87QUFDWCxhQUFXLEVBQUUscUJBQXFCO0VBQ25DLENBQUMsQ0FDRCxLQUFLLENBQUMsVUFBVSxFQUFDO0FBQ2hCLEtBQUcsRUFBQyxLQUFLLEdBQUMsV0FBVztBQUNyQixhQUFXLEVBQUUsNkJBQTZCO0VBQzNDLENBQUMsQ0FDQSxLQUFLLENBQUMsaUJBQWlCLEVBQUM7QUFDeEIsS0FBRyxFQUFDLEtBQUssR0FBQyxVQUFVO0FBQ3BCLGFBQVcsRUFBRSw2QkFBNkI7RUFDMUMsQ0FBQyxDQUNBLEtBQUssQ0FBQyxnQkFBZ0IsRUFBQztBQUN2QixLQUFHLEVBQUMsS0FBSyxHQUFDLFNBQVM7QUFDbkIsYUFBVyxFQUFFLDZCQUE2QjtFQUMxQyxDQUFDLENBQ0EsS0FBSyxDQUFDLHFCQUFxQixFQUFDO0FBQzVCLEtBQUcsRUFBQyxLQUFLLEdBQUMsTUFBTTtBQUNoQixhQUFXLEVBQUMsNkJBQTZCO0VBQ3pDLENBQUMsQ0FBQTtDQUVMOzs7Ozs7Ozs7Ozs7QUN0QkQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUV2RCxRQUFRLENBQUMsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRWhDLFNBQVMsUUFBUSxDQUFDLFFBQVEsRUFBQzs7QUFFMUIsV0FBTTtBQUNMLGFBQUssRUFBQyxHQUFHO0FBQ1QsWUFBSSxFQUFDLFFBQVE7QUFDYixnQkFBUSxFQUFDLEVBQUU7QUFDWCxnQkFBUSxFQUFDLEdBQUc7S0FDWixDQUFDOztBQUVGLGFBQVMsUUFBUSxDQUFDLEtBQUssRUFBQyxPQUFPLEVBQUMsS0FBSyxFQUFFOztBQUVoQyxZQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2pDLFlBQUksSUFBSSxZQUFBLENBQUM7O0FBRVQsaUJBQVMsS0FBSyxHQUFHO0FBQ2IsZ0JBQUksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUV4Qzs7QUFFRCxhQUFLLEVBQUU7Ozs7OztBQUFDLEFBUVIsWUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ25CLGFBQUssQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLFlBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDOztBQUU3QixZQUFJLElBQUksR0FBRyxDQUFBLFlBQVk7QUFDbkIsZ0JBQUksRUFBRSxHQUFHLDhDQUE4QyxHQUNuRCwyRkFBMkYsR0FDM0Ysb0lBQW9JLEdBQ3BJLDRHQUE0RyxDQUFDOztBQUVqSCxtQkFBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtTQUN0QyxDQUFBLEVBQUU7Ozs7Ozs7O0FBQUMsQUFTSixhQUFLLENBQUMsWUFBWSxHQUFHLFlBQVk7O0FBRTdCLGdCQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUM3Qix5QkFBYSxFQUFFLENBQUM7QUFDaEIsY0FBRSxDQUFDLFVBQVUsR0FBSSxLQUFLLENBQUMsVUFBVTs7QUFBQyxTQUVyQyxDQUFDO0FBQ0YsYUFBSyxDQUFDLG1CQUFtQixHQUFHLFVBQVMsR0FBRyxFQUFDOztBQUVyQyxpQkFBSyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFDdkIsY0FBRSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFDcEIsbUJBQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDMUMsaUJBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRTs7QUFBQyxTQUV0Qjs7Ozs7O0FBQUMsQUFNRixpQkFBUyxHQUFHLEdBQUc7OztBQUdYLGdCQUFJLElBQUksWUFBWSxLQUFLLEVBQUU7QUFDdkIscUJBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztBQUVsQyw2QkFBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQy9DO2FBQ0osTUFDSSxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQzs7Ozs7QUFBQSxBQUs5QyxxQkFBUyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtBQUMxQixvQkFBSSxHQUFHLFlBQVksS0FBSyxFQUFFOztBQUV0Qix5QkFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDakMsNEJBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxZQUFZLE1BQU0sRUFBRTs7QUFFMUIscUNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7eUJBQzNCLE1BQ0ksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7O0FBRW5CLHFDQUFTLENBQUMsSUFBSSxDQUFDO0FBQ1gsb0NBQUksRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2pCLHFDQUFLLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUc7NkJBQ25CLENBQUM7O0FBQUMseUJBRU47cUJBRUo7aUJBQ0osTUFDSSxJQUFJLEdBQUcsWUFBWSxNQUFNLEVBQUU7QUFDNUIsNkJBQUssSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFO0FBQ2pCLGdDQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7O0FBRWQseUNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDWCx3Q0FBSSxFQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDZCx5Q0FBSyxFQUFDLEdBQUcsQ0FBQyxHQUFHO2lDQUNoQixDQUFDOztBQUFDLDZCQUVOO0FBQ0QsZ0NBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEtBQUssRUFBRTs7QUFFM0IseUNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7NkJBQzVCO3lCQUNKO3FCQUNKO2FBQ0o7U0FDSjs7Ozs7QUFBQSxBQUtELGlCQUFTLGFBQWEsR0FBRztBQUNyQixnQkFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFDO0FBQzFCLHFCQUFLLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUM1Qix1QkFBTzthQUNWO0FBQ0QsaUJBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRTs7O0FBQUMsQUFHbkIsc0JBQVUsRUFBRSxDQUFDO0FBQ2Isd0JBQVksRUFBRSxDQUFDO0FBQ2YscUJBQVMsVUFBVSxHQUFHO0FBQ2pCLHFCQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLEdBQUMsU0FBUyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztBQUNsQyx3QkFBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsd0JBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUcsRUFBRSxFQUFFLE9BQU87aUJBQ3ZDO2FBQ0w7QUFDRCxxQkFBUyxZQUFZLEdBQUU7QUFDbkIseUJBQVMsQ0FBQyxJQUFJLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQ3hCLDJCQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ3hDLENBQUMsQ0FBQTthQUNMO0FBQ0QscUJBQVMsVUFBVSxDQUFDLENBQUMsRUFBQztBQUNsQix1QkFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7YUFDeEU7U0FFSjtLQUNQO0NBQ0Q7Ozs7Ozs7O0FDOUpELE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBQyxRQUFRLENBQUMsQ0FBQzs7QUFHckQsU0FBUyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUM7OztBQUd4QyxRQUFJLEtBQUssR0FBRyxFQUFFOzs7QUFBQyxBQUdaLFNBQUssQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLFNBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRTs7O0FBQUMsQUFHakIsUUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUU7Ozs7QUFBQyxBQUl0QixRQUFJLFFBQVEsR0FBRTtBQUNWLGdCQUFRLEVBQUcsS0FBSztBQUNoQixlQUFPLEVBQUcsS0FBSztBQUNmLGFBQUssRUFBQyxLQUFLO0tBQ2Q7Ozs7Ozs7QUFBQyxBQU9GLFNBQUssQ0FBQyxJQUFJLEdBQUcsWUFBVTtBQUNuQixlQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUE7QUFDckQsZ0JBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsQ0FBQyxFQUFHO0FBQzlCLGlCQUFLLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDeEIsb0JBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLGlCQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDdkIsQ0FBQyxDQUNELEtBQUssQ0FBQyxVQUFDLEdBQUcsRUFBRztBQUNWLG1CQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzNDLENBQUMsQ0FBQztLQUNOOzs7OztBQUFDLEFBS0YsU0FBSyxDQUFDLFdBQVcsR0FBRyxZQUFVOzs7QUFHMUIsaUJBQVMsSUFBSSxDQUFDLENBQUMsRUFBRTtBQUNiLG9CQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUk7QUFDakYsNkJBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ2pDLG9CQUFHLENBQUMsR0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxLQUNyQzs7QUFDQSwyQkFBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUM1Qiw0QkFBUSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDeEIseUJBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztpQkFDckI7YUFDSixDQUFDLENBQUM7U0FDTjtBQUNELFlBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNYOzs7OztBQUFDLEFBS0YsU0FBSyxDQUFDLFNBQVMsR0FBRyxZQUFVOzs7QUFHeEIsaUJBQVMsSUFBSSxDQUFDLENBQUMsRUFBRTtBQUNiLG9CQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUk7QUFDL0UscUJBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixvQkFBRyxDQUFDLEdBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsS0FDckM7O0FBQ0EsNEJBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ3RCLDJCQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO2lCQUM3QjthQUNKLENBQUMsQ0FBQztTQUNOO0FBQ0QsWUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ1g7Ozs7Ozs7Ozs7QUFBQyxBQVlGLFNBQUssQ0FBQyxXQUFXLEdBQUcsVUFBUyxVQUFVLEVBQUM7O0FBRXBDLFlBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRTs7O0FBQUMsQUFHakMsYUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDOztBQUVuQyxpQkFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDOzs7QUFHdEMsb0JBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUcsVUFBVSxDQUFDLEtBQUssSUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBRyxDQUFDLEVBQUM7O0FBRTVFLHlCQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQ3pDLDJCQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QiwyQkFBTyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUU1QjthQUNKO1NBQ0o7S0FFSjs7Ozs7O0FBQUMsQUFNRixTQUFLLENBQUMsU0FBUyxHQUFHLFlBQVU7QUFDeEIsZUFBTyxFQUFFLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFHO0FBQ3pCLHVDQUEyQixDQUFDLFVBQVUsRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ3ZFLENBQUMsQ0FBQztLQUNOLENBQUM7QUFDRixTQUFLLENBQUMsYUFBYSxHQUFHLFlBQVU7QUFDNUIsZUFBTyxFQUFFLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFHO0FBQ3pCLHVDQUEyQixDQUFDLFNBQVMsRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ3RFLENBQUMsQ0FBQztLQUNOLENBQUM7QUFDRixTQUFLLENBQUMsY0FBYyxHQUFHLFlBQVU7QUFDN0IsZUFBTyxFQUFFLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFHO0FBQ3pCLHVDQUEyQixDQUFDLE9BQU8sRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ2pFLENBQUMsQ0FBQztLQUNOOzs7Ozs7Ozs7QUFBQyxBQVNGLFNBQUssQ0FBQyxXQUFXLEdBQUcsVUFBUyxjQUFjLEVBQUM7QUFDeEMsZUFBTyxFQUFFLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFHOztBQUV6QixnQkFBSSxTQUFTLFlBQUEsQ0FBQztBQUNkLGdCQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsS0FDMUI7QUFDQSx3QkFBUSxDQUFDLFlBQUk7QUFDVCx3QkFBRyxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLEtBQ3pCLE1BQU0sQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFBO2lCQUN4RCxFQUFDLElBQUksQ0FBQyxDQUFBO2FBQ1Y7O0FBRUQscUJBQVMsUUFBUSxHQUFFO0FBQ2Ysb0JBQUcsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDO0FBQzNDLHVCQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQzVCLHVCQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO2FBQ2xDOzs7QUFBQSxBQUdELHFCQUFTLFlBQVksR0FBRTtBQUNuQixxQkFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ3ZDLHlCQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ2pELDRCQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxjQUFjLENBQUMsSUFBSSxFQUFDO0FBQzFELDBDQUFjLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUMxRCxtQ0FBTzt5QkFDVjtxQkFDSjtpQkFDSjthQUNKOztBQUVELHFCQUFTLG1CQUFtQixHQUFFOztBQUUxQixxQkFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ25DLHlCQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDdkMsNEJBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssY0FBYyxDQUFDLE9BQU8sRUFBRTtBQUNwRCxpQ0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQztBQUM3QyxtQ0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3lCQUM1QjtxQkFDSjtpQkFDSjthQUNKO1NBQ0osQ0FBQyxDQUFDO0tBQ047Ozs7OztBQUFDLEFBTUYsYUFBUywyQkFBMkIsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUM7QUFDMUQsWUFBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQ2pDO0FBQ0Esb0JBQVEsQ0FBQyxZQUFJOztBQUNULG9CQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FDaEMsTUFBTSxDQUFDLHdDQUF3QyxDQUFDLENBQUE7YUFDeEQsRUFBQyxJQUFJLENBQUMsQ0FBQTtTQUNWO0tBQ0o7Ozs7O0FBQUEsQUFLRCxhQUFTLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFDO0FBQzNCLGVBQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEIsYUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ3RDLGdCQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUM7QUFDeEMscUJBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO2FBQy9CO1NBQ0o7S0FDSjs7QUFFRCxTQUFLLENBQUMsSUFBSSxFQUFFO0FBQUMsQUFDaEIsV0FBTyxLQUFLLENBQUM7Q0FDYjs7O0FBQUE7Ozs7OztBQ25ORCxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUMsUUFBUSxDQUFDOzs7O0FBQUMsQUFJeEQsU0FBUyxRQUFRLENBQUMsUUFBUSxFQUFDLFlBQVksRUFBRSxNQUFNLEVBQUM7OztBQUc1QyxRQUFJLEVBQUUsR0FBRyxJQUFJOzs7O0FBQUMsQUFJZCxLQUFDLFlBQVU7QUFDUCxnQkFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLElBQUksRUFBRztBQUNsQyxjQUFFLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztTQUV0QixDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUMsR0FBRyxFQUFHO0FBQ1osbUJBQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7U0FDckIsQ0FBQyxDQUFDO0tBRU4sQ0FBQSxFQUFHOzs7O0FBQUMsQUFJTCxNQUFFLENBQUMsWUFBWSxHQUFHLFlBQVU7O0FBRXhCLGVBQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQzs7QUFBQyxBQUUzQixZQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM1QyxlQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2Ysb0JBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDOztBQUFDLEFBRTVCLGNBQU0sQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUU7QUFDN0IsaUJBQUssRUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUN2QixjQUFFLEVBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7U0FDN0IsQ0FBQyxDQUFDO0tBQ04sQ0FBQztDQUVMOzs7Ozs7O0FDckNELE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBQyxRQUFRLENBQUMsQ0FBQzs7QUFFckQsUUFBUSxDQUFDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQUU3QixTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUM7O0FBRXBCLFFBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQzs7QUFFZixRQUFJLE9BQU8sR0FBRyxNQUFNOzs7Ozs7O0FBQUMsQUFPckIsU0FBSyxDQUFDLEdBQUcsR0FBRyxVQUFTLEtBQUssRUFBQztBQUN2QixlQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxHQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ25DLENBQUM7O0FBRUYsV0FBTyxLQUFLLENBQUM7Q0FDaEI7Ozs7Ozs7QUNwQkQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFDLFlBQVksQ0FBQyxDQUFDOztBQUVoRSxZQUFZLENBQUMsT0FBTyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7O0FBRXhDLFNBQVMsWUFBWSxDQUFDLFlBQVksRUFBQzs7O0FBRy9CLFFBQUksRUFBRSxHQUFHLElBQUk7OztBQUFDLEFBR2QsZ0JBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJLEVBQUc7QUFDcEMsWUFBSSxDQUFDLFFBQVEsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzlDLFVBQUUsQ0FBQyxZQUFZLEdBQUUsSUFBSSxDQUFDO0FBQ3RCLGVBQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQ2hDLENBQUM7OztBQUFDLEFBR0gsYUFBUyxjQUFjLENBQUMsQ0FBQyxFQUFDO0FBQ3RCLGFBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ3pCLGlCQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7O2FBRXJDO1NBQ0o7QUFDRCxlQUFPLENBQUMsQ0FBQztLQUNaO0NBRUo7Ozs7Ozs7QUMxQkQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFDLFlBQVksQ0FBQzs7OztBQUFDLEFBSTdELFNBQVMsWUFBWSxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFDOzs7QUFHaEQsUUFBSSxRQUFRLEdBQUcsRUFBRTs7O0FBQUMsQUFHZixRQUFJLGNBQWMsR0FBRTtBQUNoQixrQkFBVSxFQUFFLElBQUk7QUFDaEIsWUFBSSxFQUFFLElBQUk7S0FDYixDQUFDOztBQUVGLFFBQUksY0FBYyxHQUFHLEVBQUU7OztBQUFDLEFBR3hCLFFBQUksUUFBUSxZQUFBOzs7Ozs7Ozs7QUFBQyxBQVNiLGFBQVMsVUFBVSxHQUFHO0FBQ2xCLHNCQUFjLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxFQUFFLENBQUM7QUFDNUMsc0JBQWMsQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztBQUN6QyxZQUFHLGNBQWMsQ0FBQyxVQUFVLEtBQUcsY0FBYyxDQUFDLFVBQVUsSUFBRSxjQUFjLENBQUMsSUFBSSxLQUFHLGNBQWMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxHQUFHLElBQUksQ0FBQzs7OztBQUFBLEtBSXhIOzs7Ozs7Ozs7QUFBQSxBQVNELFlBQVEsQ0FBQyxXQUFXLEdBQUcsVUFBUyxHQUFHLEVBQUM7QUFDaEMsc0JBQWMsR0FBRyxHQUFHLENBQUM7S0FDeEI7Ozs7Ozs7O0FBQUMsQUFRRixZQUFRLENBQUMsV0FBVyxHQUFHLFlBQVU7QUFDN0IsZUFBTyxFQUFFLENBQUMsVUFBQyxPQUFPLEVBQUMsTUFBTSxFQUFHOztBQUV4QixzQkFBVSxFQUFFLENBQUM7QUFDYixnQkFBRyxRQUFRLEVBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEtBRWpDO0FBQ0Esd0JBQVEsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsR0FBRyxFQUFHO0FBQzdDLDRCQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzFCLDJCQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7aUJBQzNCLENBQUMsQ0FDRCxLQUFLLENBQUMsVUFBQyxHQUFHLEVBQUc7QUFDViwyQkFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2lCQUNmLENBQUMsQ0FBQTthQUNMO1NBQ0osQ0FBQyxDQUFBO0tBRUwsQ0FBQzs7QUFHTCxXQUFPLFFBQVEsQ0FBQztDQUNoQiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4qIEFuZ3VsYXIgbW9kdWxlXHJcbiovXHJcblxyXG52YXIgQVBQTkFNRSA9IFwibHVra2FyaVwiO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoQVBQTkFNRSwgWyd1aS5yb3V0ZXInLCduZ01hdGVyaWFsJ10pO1xyXG5cclxuLypcclxuKiBVdGlsaXR5XHJcbiAqL1xyXG5EYXRlLnByb3RvdHlwZS5nZXRXZWVrID0gZnVuY3Rpb24oKSB7XHJcbiAgICBsZXQgb25lamFuID0gbmV3IERhdGUodGhpcy5nZXRGdWxsWWVhcigpLCAwLCAxKTtcclxuICAgIHJldHVybiBNYXRoLmNlaWwoKCgodGhpcyAtIG9uZWphbikgLyA4NjQwMDAwMCkgKyBvbmVqYW4uZ2V0RGF5KCkgKyAxKSAvIDcpO1xyXG59OyIsIi8qXHJcbipcdFVJIFJvdXRlc1xyXG4qL1xyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FKS5jb25maWcoc3RhdGVzLFwic3RhdGVzXCIpO1xyXG5zdGF0ZXMuJGluamVjdCA9IFsnJHN0YXRlUHJvdmlkZXInLCAnJHVybFJvdXRlclByb3ZpZGVyJ107XHJcblxyXG5mdW5jdGlvbiBzdGF0ZXMgKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpe1xyXG5cdFwidXNlIHN0cmljdFwiO1xyXG5cdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCJmaW5kXCIpO1xyXG5cdHZhciByb3V0ZSA9IFwiXCI7XHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHQuc3RhdGUoXCJmaW5kXCIse1xyXG5cdCBcdHVybDpcIi9maW5kXCIsXHJcblx0IFx0dGVtcGxhdGVVcmw6IFwiL2FwcC9maW5kL2ZpbmQuaHRtbFwiXHJcblx0fSkgXHJcblx0LnN0YXRlKFwic2NoZWR1bGVcIix7XHJcblx0IFx0dXJsOnJvdXRlK1wiL3NjaGVkdWxlXCIsXHJcblx0IFx0dGVtcGxhdGVVcmw6IFwiL2FwcC9zY2hlZHVsZS9zY2hlZHVsZS5odG1sXCJcclxuXHR9KVxyXG5cdFx0LnN0YXRlKFwic2NoZWR1bGUuY2FtcHVzXCIse1xyXG5cdFx0XHR1cmw6cm91dGUrXCIvOmNhbXB1c1wiLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogXCIvYXBwL3NjaGVkdWxlL3NjaGVkdWxlLmh0bWxcIlxyXG5cdFx0fSlcclxuXHRcdFx0LnN0YXRlKFwic2NoZWR1bGUuY2xhc3NcIix7XHJcblx0XHRcdFx0dXJsOnJvdXRlK1wiLzpjTmFtZVwiLFxyXG5cdFx0XHRcdHRlbXBsYXRlVXJsOiBcIi9hcHAvc2NoZWR1bGUvc2NoZWR1bGUuaHRtbFwiXHJcblx0XHRcdH0pXHJcblx0XHRcdFx0LnN0YXRlKFwic2NoZWR1bGUuY2xhc3Mud2Vla1wiLHtcclxuXHRcdFx0XHRcdHVybDpyb3V0ZStcIi86d25cIixcclxuXHRcdFx0XHRcdHRlbXBsYXRlVXJsOlwiL2FwcC9zY2hlZHVsZS9zY2hlZHVsZS5odG1sXCJcclxuXHRcdFx0XHR9KVxyXG5cclxufVxyXG4iLCJcclxuLyoqXHJcbiogQXV0byBmaWxsIHwgTm90ZSB0aGlzIGlzIHJlZHVuZGFudCBzaW5jZSB3ZSdyZSB1c2luZyBuZy1tYXRlcmlhbFxyXG4qIEBkZXNjICpBdXRvIGZpbGxzIHNlYXJjaGVzKlxyXG4qIEBwYXJhbTogYXV0by1maWxsLXZtOiB2bSB0byB0YXJnZXRcclxuKiBAcGFyYW06IGF1dG8tZmlsbC1zcmM6IGEgcHJvcGVydHkgb2Ygdm0gdG8gc2VhcmNoXHJcbiogQHBhcmFtOiBhdXRvLWZpbGwta2V5czoga2V5cyB0byBzZWFyY2ggaW4gc3JjIHwgc3RyaW5nIG9yIGFycmF5XHJcbiogQHBhcmFtOiBhdXRvLWZpbGwtY2I6IGZ1bmN0aW9uIHRvIGV4ZWN1dGUgb24gdXNlciBhY3Rpb24sIHBhc3NlZCB0aGUga2V5IGFuZCBpdCdzIHBhdGggZm91bmRcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmRpcmVjdGl2ZShcImF1dG9GaWxsXCIsYXV0b0ZpbGwpO1xyXG5cclxuYXV0b0ZpbGwuJGluamVjdCA9IFtcIiRjb21waWxlXCJdO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZpbGwoJGNvbXBpbGUpe1xyXG5cclxuXHRyZXR1cm57XHJcblx0XHRzY29wZTpcIj1cIixcclxuXHRcdGxpbms6bGlua0Z1bmMsXHJcblx0XHR0ZW1wbGF0ZTpcIlwiLFxyXG5cdFx0cmVzdHJpY3Q6XCJFXCJcclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiBsaW5rRnVuYyhzY29wZSxlbGVtZW50LGF0dHJzKSB7XHJcblxyXG4gICAgICAgIGxldCB2bSA9IHNjb3BlW2F0dHJzLmF1dG9GaWxsVm1dO1xyXG4gICAgICAgIGxldCBrZXlzO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBrZXlzWigpIHtcclxuICAgICAgICAgICAga2V5cyA9IGF0dHJzLmF1dG9GaWxsS2V5cy5zcGxpdChcIixcIik7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAga2V5c1ooKTtcclxuXHJcblxyXG5cclxuICAgICAgICAvL3Njb3BlLm91dHB1dHMgPVswLDAsMCwwLDAsMCwwLDAsMCwwXTtcclxuICAgICAgICAvLyBsZXQgc3JjID0gdm1bYXR0cnMuYXV0b0ZpbGxWbVNyY107XHJcbiAgICAgICAgLy8gbGV0IGNiID0gdm1bYXR0cnMuYXV0b0ZpbGxDYl07XHJcblxyXG4gICAgICAgIGxldCB0YXJnZXRBcnIgPSBbXTtcclxuICAgICAgICBzY29wZS5zZWFyY2hNb2RlbCA9IFtdO1xyXG4gICAgICAgIGlmICghdGFyZ2V0QXJyLmxlbmd0aCkgbWFwKCk7XHJcblxyXG4gICAgICAgIGxldCBpbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBsZXQgZWwgPSBcIjxkaXYgbmctY2xpY2s9J3NlYXJjaFRoaXMoKScgY2xhc3M9J3NlYXJjaCc+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8aW5wdXQgY2xhc3M9J2RhdGEtc2VhcmNoJyB0eXBlPSd0ZXh0JyBuZy1tb2RlbD0nc2VhcmNoTW9kZWwnIG5nLWNoYW5nZT0naW5wdXRDaGFuZ2VkKCknPlwiICtcclxuICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nc2VhcmNoLW91dHB1dCc+PGRpdiBjbGFzcz0naXRlbSBpdGVtLWxhYmVsIHNlYXJjaC1vdXRwdXQtc2luZ2xlJyBuZy1yZXBlYXQ9J3NlYXJjaE91dHB1dCBpbiBvdXRwdXRzIHRyYWNrIGJ5ICRpbmRleCcgPlwiICtcclxuICAgICAgICAgICAgICAgIFwiPHNwYW4gbmctY2xpY2s9J2FjdGl2YXRlU2VhY2hPdXRwdXQoc2VhcmNoT3V0cHV0KScgY2xhc3M9Jyc+e3tzZWFyY2hPdXRwdXQubmFtZX19PC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PlwiO1xyXG5cclxuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoZWwpKHNjb3BlKSlcclxuICAgICAgICB9KCk7XHJcblxyXG4gICAgICAgIC8vRXZlbnQgbGlzdGVuZXJzXHJcbiAgICAgICAvKiBzY29wZS5zZWFyY2hUaGlzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGF0dHJzLCBhdHRycy5hdXRvRmlsbFZtVGFyZ2V0KVxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHNyYyxhdHRycy5hdXRvRmlsbFZtU3JjLCB2bVthdHRycy5hdXRvRmlsbFZtU3JjXSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2VhcmNoXCIsIHZtKTtcclxuXHJcbiAgICAgICAgfTsqL1xyXG4gICAgICAgIHNjb3BlLmlucHV0Q2hhbmdlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImlucHV0ISB2YWx1ZTpcIiwgc2NvcGUuc2VhcmNoTW9kZWwpO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldEFyci5sZW5ndGgpIG1hcCgpO1xyXG4gICAgICAgICAgICBzZWFyY2hCeU1vZGVsKCk7XHJcbiAgICAgICAgICAgIHZtLnNlYWNoTW9kZWwgPSAgc2NvcGUuc2VhY2hNb2RlbDtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcImlucHV0ISB2YWx1ZTpcIiwgc2NvcGUub3V0cHV0cyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBzY29wZS5hY3RpdmF0ZVNlYWNoT3V0cHV0ID0gZnVuY3Rpb24odmFsKXtcclxuICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImlucHV0ISB2YWx1ZTpcIiwgdmFsKTtcclxuICAgICAgICAgICAgc2NvcGUuc2VhY2hNb2RlbCA9IHZhbDtcclxuICAgICAgICAgICAgdm0uc2VhY2hNb2RlbCA9IHZhbDtcclxuICAgICAgICAgICAgZWxlbWVudC5maW5kKFwiaW5wdXRcIilbMF0udmFsdWUgPSB2YWwubmFtZTtcclxuICAgICAgICAgICAgc2NvcGUub3V0cHV0cyA9IFtdO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5wdXQhIHZhbHVlOlwiLCBlbGVtZW50LmZpbmQoXCJpbnB1dFwiKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBTZWFyY2ggZnVuY3Rpb25cclxuICAgICAgICAgKiBJZiB0aGUga2V5cyBhcmUgYW4gYXJyYXkgZmluZCBlYWNoXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gbWFwKCkge1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhrZXlzLCBrZXlzIGluc3RhbmNlb2YgQXJyYXkpXHJcbiAgICAgICAgICAgIGlmIChrZXlzIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwia2V5c1wiLGtleXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlY3Vyc2lvbih2bVthdHRycy5hdXRvRmlsbFZtU3JjXSwga2V5c1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSByZWN1cnNpb24odm1bYXR0cnMuYXV0b0ZpbGxWbVNyY10sIGtleXMpO1xyXG5cclxuICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICogUmVjdXJzaW9uIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBmdW5jdGlvbiByZWN1cnNpb24oYXJyLCBwcm9wKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFycltpXSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYXllcnMucHVzaChpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2lvbihhcnJbaV0sIHByb3ApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFycltpXVtwcm9wXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYXllcnMucHVzaChpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEFyci5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOmFycltpXVtwcm9wXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzczphcnJbaV0uX2lkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwia2V5IGZvdW5kXCIsIHRhcmdldEFycltpXSxhcnJbaV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXJyIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGFycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBwcm9wKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0QXJyLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6YXJyW3Byb3BdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOmFyci5faWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcImtleSBmb3VuZFwiLCBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFycltrZXldIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbGF5ZXJzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2lvbihhcnJba2V5XSwgcHJvcClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy91c2VyIGFjdGl2YXRlZCBzZWFyY2hcclxuICAgICAgICAvL3NlYXJjaE1vZGVsIG5vdyBoYXMgbmV3IHZhbFxyXG5cclxuICAgICAgICBmdW5jdGlvbiBzZWFyY2hCeU1vZGVsKCkge1xyXG4gICAgICAgICAgICBpZiAoIXNjb3BlLnNlYXJjaE1vZGVsLmxlbmd0aCl7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5vdXRwdXRzQWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2NvcGUub3V0cHV0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlbGVtZW50LmZpbmQoXCJkaXZcIikpXHJcbiAgICAgICAgICAgIGZpbmRUYXJnZXQoKTtcclxuICAgICAgICAgICAgZm9ybWF0VGFyZ2V0KCk7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGZpbmRUYXJnZXQoKSB7XHJcbiAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPHRhcmdldEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihmaW5kU2ltcGxlKHRhcmdldEFycltpXSk+LTEpIHNjb3BlLm91dHB1dHMucHVzaCh0YXJnZXRBcnJbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHNjb3BlLm91dHB1dHMubGVuZ3RoID49MTApIHJldHVybjtcclxuICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnVuY3Rpb24gZm9ybWF0VGFyZ2V0KCl7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXRBcnIuc29ydChmdW5jdGlvbihhLGIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaW5kU2ltcGxlKGEpIC0gZmluZFNpbXBsZShiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnVuY3Rpb24gZmluZFNpbXBsZShhKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHNjb3BlLnNlYXJjaE1vZGVsLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHR9XHJcbn0iLCIvKipcclxuKiBEYXRhIEZhY3RvcnlcclxuKiBAZGVzYyBjb21tdW5pY2F0ZXMgd2l0aCB0aGUgYXBpLCByZXR1cm5zIHByb21pc2VzIG9mIGRhdGFcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmZhY3RvcnkoXCJkYXRhRmFjdFwiLGRhdGFGYWN0KTtcclxuXHJcblxyXG5mdW5jdGlvbiBkYXRhRmFjdChodHRwRmFjdCwgJHEsICR0aW1lb3V0KXtcclxuXHJcbiAgICAvL3RoaXNcclxuXHRsZXQgZGF0YUYgPSB7fTtcclxuXHJcbiAgICAvL2RhdGEgd2UncmUgc2VydmluZ1xyXG4gICAgZGF0YUYuY2FtcHVzZXMgPSBbXTtcclxuICAgIGRhdGFGLndlZWtzID0gW107XHJcblxyXG4gICAgLy91c2VkIHRvIHBhcnNlIHRoZSB3ZWVrIG51bVxyXG4gICAgbGV0IGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgIC8vY2hlY2sgdGhlc2UgaW4gZ2V0dGVyc1xyXG4gICAgLy9pZiBkYXRhIG5vdCB5ZXQgbG9hZGVkIGZyb20gQVBJICgpPT4gdGhhdCdzIGEgcGFkZGxpbidcclxuICAgIGxldCBwcm9taXNlcyA9e1xyXG4gICAgICAgIGNhbXB1c2VzIDogZmFsc2UsXHJcbiAgICAgICAgY2xhc3NlcyA6IGZhbHNlLFxyXG4gICAgICAgIHdlZWtzOmZhbHNlXHJcbiAgICB9O1xyXG5cclxuICAgIC8vUHVibGljIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBHZXQgY2FtcHVzZXMgZGF0YSBmcm9tIEFQSVxyXG4gICAgICovXHJcbiAgICBkYXRhRi5pbml0ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkRhdGEgZmFjdG9yeSBpbml0aWFsaXplZCwgZ2V0dGluZyBkYXRhXCIpXHJcbiAgICAgICAgaHR0cEZhY3QuZ2V0KFwiL2NhbXB1c1wiKS50aGVuKChkKT0+e1xyXG4gICAgICAgICAgICBkYXRhRi5jYW1wdXNlcyA9IGQuZGF0YTtcclxuICAgICAgICAgICAgcHJvbWlzZXMuY2FtcHVzZXMgPSB0cnVlO1xyXG4gICAgICAgICAgICBkYXRhRi5pbml0Q2xhc3NlcygpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKChlcnIpPT57XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImVyckBkYXRhZmFjdCBjYW1wdXNcIixlcnIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKlxyXG4gICAgKiBHZXQgY2xhc3NlcyBkYXRhIGZyb20gQVBJXHJcbiAgICAgKi9cclxuICAgIGRhdGFGLmluaXRDbGFzc2VzID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgLy9Bc3luYyBzdGVwIGZ1bmNcclxuICAgICAgICBmdW5jdGlvbiBzdGVwKGkpIHtcclxuICAgICAgICAgICAgaHR0cEZhY3QuZ2V0KFwiL2NhbXB1cy9cIiArIGVuY29kZVVSSShkYXRhRi5jYW1wdXNlc1tpXS5uYW1lKSArIFwiL2NsYXNzZXNcIikudGhlbigoZCk9PiB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZUNhbXB1c2VzKGQuZGF0YSwgXCJjbGFzc2VzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYoaTxkYXRhRi5jYW1wdXNlcy5sZW5ndGgtMSkgc3RlcChpKz0xKTtcclxuICAgICAgICAgICAgICAgIGVsc2V7ICAgLy9DbGFzc2VzIGRvbmVcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNsYXNzZXMgZG9uZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5jbGFzc2VzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhRi5pbml0V2Vla3MoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ZXAoMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBHZXQgd2Vla3MgZGF0YSBmcm9tIEFQSVxyXG4gICAgICovXHJcbiAgICBkYXRhRi5pbml0V2Vla3MgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAvL0FzeW5jIHN0ZXAgZnVuY1xyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAoaSkge1xyXG4gICAgICAgICAgICBodHRwRmFjdC5nZXQoXCIvY2FtcHVzL1wiICsgZW5jb2RlVVJJKGRhdGFGLmNhbXB1c2VzW2ldLm5hbWUpICsgXCIvd2Vla3NcIikudGhlbigoZCk9PiB7XHJcbiAgICAgICAgICAgICAgICBkYXRhRi53ZWVrcy5wdXNoKGQuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBpZihpPGRhdGFGLmNhbXB1c2VzLmxlbmd0aC0xKSBzdGVwKGkrPTEpO1xyXG4gICAgICAgICAgICAgICAgZWxzZXsgLy93ZWVrcyBkb25lXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMud2Vla3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwid2Vla3MgZG9uZVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ZXAoMCk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgLypcclxuICAgICBHZXR0ZXJzXHJcbiAgICAgKi9cclxuXHJcbiAgICAgLyoqXHJcbiAgICAgKiBQYXJzZSBhIHdlZWsncyBkYXRhIGJhc2VkIG9uIHNlbGVjdGVkIGRhdGUgJiBjbGFzcyBuYW1lXHJcbiAgICAgKiBAcGFyYW0gc2VhY2hNb2RlbCBvYmogLSAud2Vla051bWJlcjogLm5hbWU6IFxyXG4gICAgICovXHJcbiAgICBkYXRhRi5nZXRXZWVrRGF0YSA9IGZ1bmN0aW9uKHNlYWNoTW9kZWwpe1xyXG5cclxuICAgICAgICBsZXQgdyA9IG5ldyBEYXRlKGRhdGUpLmdldFdlZWsoKTtcclxuXHJcbiAgICAgICAgLy9XZWVrcyA9IGFsbCBjYW1wdXNlcyBhbGwgd2Vla3NcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZGF0YUYud2Vla3MubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIC8vV2Vla3NbaV0gPSBhbGwgd2Vla3MgZnJvbSAxIGNhbXB1c1xyXG4gICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZGF0YUYud2Vla3NbaV0ubGVuZ3RoO2orKyl7IFxyXG4gICAgICAgICAgICAgICAgLy9XZWVrc1tpXVtqXSA9IGRhdGEgZnJvbSAxIHdlZWtzIGZyb20gMSBjYW1wdXNcclxuICAgICAgICAgICAgICAgIC8vSGFzIGNsYXNzOmFzZGFzZCAsIHdlZWtOdW1iZXI6NDlcclxuICAgICAgICAgICAgICAgIGlmKGRhdGFGLndlZWtzW2ldW2pdLmNsYXNzPT09c2VhY2hNb2RlbC5jbGFzcyYmZGF0YUYud2Vla3NbaV1bal0ud2Vla051bWJlcj09PXcpe1xyXG4gICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm1hdGNoIVwiLGRhdGFGLndlZWtzW2ldW2pdLHcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFGLndlZWtzW2ldW2pdLm5hbWUgPSBzZWFjaE1vZGVsLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YUYud2Vla3NbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhRi53ZWVrc1tpXVtqXTtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKlxyXG4gICAgKiBDYW1wdXMgfCBDbGFzcyB8IFdlZWtcclxuICAgICogSWYgZGF0YSBub3QgeWV0IGxvYWRlZCByZXNvbHZlLCB3YWl0IGEgc2VjLCBpZiBzdGlsbCBub3QgcmVqZWN0XHJcbiAgICAgKi9cclxuICAgIGRhdGFGLmdldENhbXB1cyA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuICRxKChyZXNvbHZlLCByZWplY3QpPT57XHJcbiAgICAgICAgICAgIGNoZWNrRm9yU3RhdHVzUmV0dXJuUHJvbWlzZShcImNhbXB1c2VzXCIsXCJjYW1wdXNlc1wiLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIGRhdGFGLmdldENhbXB1c0RhdGEgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiAkcSgocmVzb2x2ZSwgcmVqZWN0KT0+e1xyXG4gICAgICAgICAgICBjaGVja0ZvclN0YXR1c1JldHVyblByb21pc2UoXCJjbGFzc2VzXCIsXCJjYW1wdXNlc1wiLCByZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIGRhdGFGLmdldENhbXB1c1dlZWtzID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUsIHJlamVjdCk9PntcclxuICAgICAgICAgICAgY2hlY2tGb3JTdGF0dXNSZXR1cm5Qcm9taXNlKFwid2Vla3NcIixcIndlZWtzXCIsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIGEgd2VlayBzY2hlZHVsZVxyXG4gICAgICogTm90ZSB0aGF0IHdlIGNhbnQgcmV0dXJuIHNvbWV0aGluZyB3ZSBkb24ndCBoYXZlIC0+IG1ha2Ugc3VyZSB3ZSBoYXZlIHRoZSBkYXRhIGZpcnN0LCB0aGVuIHBhcnNlXHJcbiAgICAgKiBAcGFyYW0gY3VycmVudEJ5U3RhdGUgLSBvYmo6IHdlZWsgbnVtYmVyLCBjbGFzcyBuYW1lIE9QVElPTkFMIGNsYXNzIGlkXHJcbiAgICAgKiBAcmV0dXJuIHByb21pc2Ugb2YgZGF0YVxyXG4gICAgICpcclxuICAgICAqL1xyXG4gICAgZGF0YUYuZ2V0U2NoZWR1bGUgPSBmdW5jdGlvbihjdXJyZW50QnlTdGF0ZSl7XHJcbiAgICAgICAgcmV0dXJuICRxKChyZXNvbHZlLCByZWplY3QpPT57XHJcblxyXG4gICAgICAgICAgICBsZXQgcmV0dXJuVmFsO1xyXG4gICAgICAgICAgICBpZihwcm9taXNlcy53ZWVrcykgbWFpbkxvb3AoKTtcclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICR0aW1lb3V0KCgpPT57XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocHJvbWlzZXMud2Vla3MpIG1haW5Mb29wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZWplY3QoXCJBUEkgdW5hdmFpbGFibGUgYXQgdGhpcyB0aW1lLCBzbyBzb3JyeVwiKVxyXG4gICAgICAgICAgICAgICAgfSw1MDAwKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiBtYWluTG9vcCgpe1xyXG4gICAgICAgICAgICAgICAgaWYoIWN1cnJlbnRCeVN0YXRlLmNsYXNzSWQpIGdldENsYXNzRGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coY3VycmVudEJ5U3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShnZXRXZWVrRGF0YVNjaGVkdWxlKCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL3ByaXZhdGUgbWFwcGluZyBmdW5jdGlvbiwgZmluZCBjbGFzcyBpZCBieSBuYW1lXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldENsYXNzRGF0YSgpe1xyXG4gICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPCBkYXRhRi5jYW1wdXNlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZGF0YUYuY2FtcHVzZXNbaV0uY2xhc3Nlcy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFGLmNhbXB1c2VzW2ldLmNsYXNzZXNbal0ubmFtZSA9PT0gY3VycmVudEJ5U3RhdGUubmFtZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50QnlTdGF0ZS5jbGFzc0lkID0gZGF0YUYuY2FtcHVzZXNbaV0uY2xhc3Nlc1tqXS5faWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldFdlZWtEYXRhU2NoZWR1bGUoKXtcclxuICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YUYud2Vla3MpO1xyXG4gICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPGRhdGFGLndlZWtzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaiA9IDA7ajxkYXRhRi53ZWVrc1tpXS5sZW5ndGg7aisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhRi53ZWVrc1tpXVtqXS5jbGFzcyA9PT0gY3VycmVudEJ5U3RhdGUuY2xhc3NJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUYud2Vla3NbaV1bal0ubmFtZSA9IGN1cnJlbnRCeVN0YXRlLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YUYud2Vla3NbaV1bal07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLy9Qcml2YXRlXHJcbiAgICAvKlxyXG4gICAgKiBJZiBkYXRhIG5vdCB5ZXQgbG9hZGVkIHJlc29sdmUsIHdhaXQgYSBzZWMsIGlmIHN0aWxsIG5vdCByZWplY3RcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gY2hlY2tGb3JTdGF0dXNSZXR1cm5Qcm9taXNlKHAsIGRhdGEsIHJlc29sdmUsIHJlamVjdCl7XHJcbiAgICAgICAgaWYocHJvbWlzZXNbcF0pIHJlc29sdmUoZGF0YUZbZGF0YV0pO1xyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICR0aW1lb3V0KCgpPT57ICAvLyBjb25zb2xlLmxvZyhjYW1wdXNlcyk7XHJcbiAgICAgICAgICAgICAgICBpZihwcm9taXNlc1twXSkgcmVzb2x2ZShkYXRhRltkYXRhXSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHJlamVjdChcIkFQSSB1bmF2YWlsYWJsZSBhdCB0aGlzIHRpbWUsIHNvIHNvcnJ5XCIpXHJcbiAgICAgICAgICAgIH0sNTAwMClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICogQXNzaWduIGEgY2FtcHVzIGl0J3MgY2xhc3Nlc1xyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBwYXJzZUNhbXB1c2VzKGRhdGEsIGspe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgIGZvcihsZXQgaiA9IDA7ajxkYXRhRi5jYW1wdXNlcy5sZW5ndGg7aisrKXsgXHJcbiAgICAgICAgICAgIGlmKGRhdGFGLmNhbXB1c2VzW2pdLl9pZCA9PT0gZGF0YVswXS5jYW1wdXMpe1xyXG4gICAgICAgICAgICAgICAgZGF0YUYuY2FtcHVzZXNbal1ba10gPSBkYXRhO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRhdGFGLmluaXQoKTsgLy9zaW5nbGV0b25zIDwzXHJcblx0cmV0dXJuIGRhdGFGO1xyXG59XHJcblxyXG5cclxuLy9kYXRhRmFjdC4kaW5qZWN0ID0gW1wiaHR0cEZhY3QsICRxLCAkdGltZW91dFwiXTtcclxuIiwiLypcclxuKiBGaW5kIENvbnRyb2xsZXJcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmNvbnRyb2xsZXIoXCJmaW5kQ3RybFwiLGZpbmRDdHJsKTtcclxuXHJcbi8vc2ZpbmRDdHJsLiRpbmplY3QgPSBbXCJkYXRhRmFjdCxzY2hlZHVsZUZhY3QsICRzdGF0ZVwiXTtcclxuXHJcbmZ1bmN0aW9uIGZpbmRDdHJsKGRhdGFGYWN0LHNjaGVkdWxlRmFjdCwgJHN0YXRlKXtcclxuXHJcbiAgICAvL3RoaXNcclxuICAgIGxldCB2bSA9IHRoaXM7XHJcblxyXG4gICAgLy9JTklUXHJcbiAgICAvL2dldCBjYW1wdXMgJiBjbGFzc2VzIGRhdGFcclxuICAgIChmdW5jdGlvbigpe1xyXG4gICAgICAgIGRhdGFGYWN0LmdldENhbXB1c0RhdGEoKS50aGVuKChkYXRhKT0+e1xyXG4gICAgICAgICAgICB2bS5jYW1wdXNlcyA9IGRhdGE7XHJcblxyXG4gICAgICAgIH0pLmNhdGNoKChlcnIpPT57XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0pKCk7XHJcblxyXG4gICAgLy9FdmVudCBsaXN0ZW5lcnNcclxuICAgIC8vVEhFIEZJTkQgQUNUSU9OXHJcbiAgICB2bS5maW5kU2NoZWR1bGUgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyh2bS5zZWFjaE1vZGVsKTtcclxuICAgICAgICAvL0ZpbmQgd2VlayBhbmQgc2V0IGFzIGFjdGl2ZVxyXG4gICAgICAgIGxldCB3ID0gZGF0YUZhY3QuZ2V0V2Vla0RhdGEodm0uc2VhY2hNb2RlbCk7XHJcbiAgICAgICAgY29uc29sZS5sb2codyk7XHJcbiAgICAgICAgc2NoZWR1bGVGYWN0LnNldFNjaGVkdWxlKHcpO1xyXG4gICAgICAgIC8vZ290b1xyXG4gICAgICAgICRzdGF0ZS5nbyhcInNjaGVkdWxlLmNsYXNzLndlZWtcIiwge1xyXG4gICAgICAgICAgICBjTmFtZTplbmNvZGVVUkkody5uYW1lKSxcclxuICAgICAgICAgICAgd246ZW5jb2RlVVJJKHcud2Vla051bWJlcilcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG59XHJcblxyXG5cclxuIiwiLyoqXHJcbiogSHR0cCBmYWN0b3J5XHJcbiogQGRlc2MgY29tbXVuaWNhdGVzIHdpdGggdGhlIEFQSVxyXG4qL1xyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FKS5mYWN0b3J5KFwiaHR0cEZhY3RcIixodHRwRmFjdCk7XHJcblxyXG5odHRwRmFjdC4kaW5qZWN0ID0gW1wiJGh0dHBcIl07XHJcblxyXG5mdW5jdGlvbiBodHRwRmFjdCgkaHR0cCl7XHJcblxyXG4gICAgbGV0IGh0dHBGID0ge307XHJcblxyXG4gICAgbGV0IGFwaUFkZHIgPSBcIi9hcGlcIjtcclxuXHJcbiAgICAvL3B1YmxpY1xyXG4gICAgLypcclxuICAgICogQSBzaW1wbGUgZ2V0IGZ1bmN0aW9uXHJcbiAgICAqIEBwYXJhbSByb3V0ZSBTdHJpbmdcclxuICAgICAqL1xyXG4gICAgaHR0cEYuZ2V0ID0gZnVuY3Rpb24ocm91dGUpe1xyXG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoYXBpQWRkcityb3V0ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBodHRwRjtcclxufVxyXG5cclxuXHJcbiAiLCIvKlxyXG4qICAgU2NoZWR1bGVzIENvbnRyb2xsZXJcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmNvbnRyb2xsZXIoXCJzY2hlZHVsZUN0cmxcIixzY2hlZHVsZUN0cmwpO1xyXG5cclxuc2NoZWR1bGVDdHJsLiRpbmplY3QgPSBbXCJzY2hlZHVsZUZhY3RcIl07XHJcblxyXG5mdW5jdGlvbiBzY2hlZHVsZUN0cmwoc2NoZWR1bGVGYWN0KXtcclxuXHJcbiAgICAvL3RoaXNcclxuICAgIGxldCB2bSA9IHRoaXM7XHJcblxyXG4gICAgLy9nZXQgdGhpcyBzY2hlZHVsZSBmcm9tIGZhY3RcclxuICAgIHNjaGVkdWxlRmFjdC5nZXRTY2hlZHVsZSgpLnRoZW4oKGRhdGEpPT57XHJcbiAgICAgICAgZGF0YS5zY2hlZHVsZSA9IHBhcnNlU2NoZWR1bGVzKGRhdGEuc2NoZWR1bGUpO1xyXG4gICAgICAgIHZtLnNjaGVkdWxlSXRlbSA9ZGF0YTtcclxuICAgICAgICBjb25zb2xlLmxvZyh2bS5zY2hlZHVsZUl0ZW0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy9wYXJzZSBzY2hlZHVsZSBhcnIgdG8gbW9hciBzdWl0YWJsZSBmb3JtXHJcbiAgICBmdW5jdGlvbiBwYXJzZVNjaGVkdWxlcyhkKXtcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZC5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGRbaV0uc2xvdHMubGVuZ3RoO2orKyl7XHJcbiAgICAgICAgICAgICAgLy8gIGRbaV0uc2xvdHNbal0udGV4dCA9IGRbaV0uc2xvdHNbal0udGV4dC5yZXBsYWNlKC9cXHMqQGJyQFxccyovZ2ksXCImbmJzcDtcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbiIsIi8qKlxyXG4gKiBTY2hlZHVsZSBmYWN0b3J5XHJcbiAqIEBkZXNjIHN0b3JlIHNjaGVkdWxlIGRhdGEsIGdldCBvbmUgaWYgbm90IGV4aXRzXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FKS5mYWN0b3J5KFwic2NoZWR1bGVGYWN0XCIsc2NoZWR1bGVGYWN0KTtcclxuXHJcbi8vc2NoZWR1bGVGYWN0LiRpbmplY3QgPSBbXCIkc3RhdGVQYXJhbXMsIGRhdGFGYWN0LCAkcVwiXTtcclxuXHJcbmZ1bmN0aW9uIHNjaGVkdWxlRmFjdCgkc3RhdGVQYXJhbXMsIGRhdGFGYWN0LCAkcSl7XHJcblxyXG4gICAgLy90aGlzXHJcblx0bGV0IHNjaGVkdWxlID0ge307XHJcblxyXG4gICAgLy90aGUgb25lIHdlJ3JlIHNlcnZpbmcgdG8gdGhlIGNvbnRyb2xsZXJcclxuICAgIGxldCBhY3RpdmVTY2hlZHVsZSA9e1xyXG4gICAgICAgIHdlZWtOdW1iZXI6IG51bGwsXHJcbiAgICAgICAgbmFtZTogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgY3VycmVudEJ5U3RhdGUgPSB7fTtcclxuXHJcbiAgICAvL2FyZSB3ZSBzdXJlIHRoYXQgdGhlIHNjaGVkdWxlIGlzIHRoZSByaWdodCBvbmU/XHJcbiAgICBsZXQgY29tcGxldGU7XHJcblxyXG4gICAgLy9Qcml2YXRlIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBQYXJzZSBzdGF0ZSBwYXJhbXMgLSBkbyB0aGV5IG1hdGNoIHRoZSBzY2hlZHVsZSB3ZSBoYXZlP1xyXG4gICAgKiBJZiAhbWF0Y2ggfHwgd2UgZG9uJ3QgaGF2ZSBhIHNjaGVkdWxlXHJcbiAgICAqICAgR2V0IHRoZSBjb3JyZWN0IG9uZSBmb3IgZGF0YWZhY3QgYWNjb3JkaW5nIHRvIHN0YXRlcGFyYW1zXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlU3RhdGUoKSB7XHJcbiAgICAgICAgY3VycmVudEJ5U3RhdGUud2Vla051bWJlciA9ICRzdGF0ZVBhcmFtcy53bjtcclxuICAgICAgICBjdXJyZW50QnlTdGF0ZS5uYW1lID0gJHN0YXRlUGFyYW1zLmNOYW1lO1xyXG4gICAgICAgIGlmKGN1cnJlbnRCeVN0YXRlLndlZWtOdW1iZXI9PT1hY3RpdmVTY2hlZHVsZS53ZWVrTnVtYmVyJiZjdXJyZW50QnlTdGF0ZS5uYW1lPT09YWN0aXZlU2NoZWR1bGUubmFtZSkgY29tcGxldGUgPSB0cnVlO1xyXG4vKiAgICAgICAgZWxzZSBkYXRhRmFjdC5nZXRTY2hlZHVsZShjdXJyZW50QnlTdGF0ZSkudGhlbigoZGF0YSk9PntcclxuXHJcbiAgICAgICAgfSk7Ki9cclxuICAgIH1cclxuXHJcbiAgICAvL1B1YmxpYyBmdW5jdGlvbnNcclxuXHJcbiAgICAvL1NldHRlcnMgJiBHZXR0ZXJzXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gb2JqXHJcbiAgICAgKi9cclxuICAgIHNjaGVkdWxlLnNldFNjaGVkdWxlID0gZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICBhY3RpdmVTY2hlZHVsZSA9IG9iajtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKkBkZXNjIEdldCB0aGUgc2NoZWR1bGUgd2UncmUgdXNpbmdcclxuICAgICAqIEByZXR1cm4gcHJvbWlzZSwgdGhlbiB0aGUgZGF0YVxyXG4gICAgICogIGlmIHdlIGRvbid0IGhhdmUgaXQgd2UnbGwgaGF2ZSB0byBwYXJzZSBpdCBmcm9tIHN0YXRlcGFyYW1zXHJcbiAgICAgKiAgICAgIGFuZCB0aGUgZ2V0IGlmIGZyb20gdGhlIGRhdGEgZmFjb3RyeVxyXG4gICAgICovXHJcbiAgICBzY2hlZHVsZS5nZXRTY2hlZHVsZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuICRxKChyZXNvbHZlLHJlamVjdCk9PntcclxuXHJcbiAgICAgICAgICAgIHBhcnNlU3RhdGUoKTtcclxuICAgICAgICAgICAgaWYoY29tcGxldGUpIHJlc29sdmUoYWN0aXZlU2NoZWR1bGUpO1xyXG5cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIGRhdGFGYWN0LmdldFNjaGVkdWxlKGN1cnJlbnRCeVN0YXRlKS50aGVuKChzY2gpPT57XHJcbiAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGUuc2V0U2NoZWR1bGUoc2NoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFjdGl2ZVNjaGVkdWxlKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycik9PntcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGVycilcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgIH07XHJcblxyXG5cclxuXHRyZXR1cm4gc2NoZWR1bGU7XHJcbn1cclxuXHJcblxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
