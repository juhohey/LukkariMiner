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

dataFact.$inject = ["httpFact, $q, $timeout"];

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
                if (promises[p]) resolve(dataF[data]);else reject("API unavailable at this time, so sorry");
            }, 5000);
        }
    }

    /*
    * Assign a campus it's classes
     */
    function parseCampuses(data, k) {
        for (var j = 0; j < dataF.campuses.length; j++) {
            if (dataF.campuses[j]._id === data[0].campus) {
                dataF.campuses[j][k] = data;
            }
        }
    }

    dataF.init(); //singletons <3
    return dataF;
}
"use strict";

/*
* Find Controller
*/

angular.module(APPNAME).controller("findCtrl", findCtrl);

findCtrl.$inject = ["dataFact,scheduleFact, $state"];

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
 * Created by admin on 26.11.2015.
 */
/*
* ng-factory
*/
angular.module(APPNAME).factory("httpFact", httpFact);

//factoryA.$inject = [""]

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

scheduleFact.$inject = ["$stateParams, dataFact, $q"];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbmZpZy5qcyIsImF1dG9maWxsL2F1dG9GaWxsLmpzIiwiZGF0YS9kYXRhRmFjdC5qcyIsImZpbmQvZmluZEN0cmwuanMiLCJIdHRwL2h0dHBGYWN0LmpzIiwic2NoZWR1bGUvc2NoZWR1bGVDdHJsLmpzIiwic2NoZWR1bGUvc2NoZWR1bGVGYWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUlBLElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQzs7QUFFeEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUMsWUFBWSxDQUFDLENBQUM7Ozs7O0FBQUMsQUFLcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsWUFBVztBQUNoQyxRQUFJLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hELFdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEFBQUMsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFBLEdBQUksUUFBUSxHQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUEsR0FBSSxDQUFDLENBQUMsQ0FBQztDQUM5RSxDQUFDOzs7Ozs7QUNYRixPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUMsUUFBUSxDQUFDLENBQUM7QUFDaEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLGdCQUFnQixFQUFFLG9CQUFvQixDQUFDLENBQUM7O0FBRTFELFNBQVMsTUFBTSxDQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBQztBQUNuRCxhQUFZLENBQUM7O0FBQ2IsbUJBQWtCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3JDLEtBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLGVBQWMsQ0FDYixLQUFLLENBQUMsTUFBTSxFQUFDO0FB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O2lCQUNmLENBQUMsQ0FBQTthQUNMO1NBQ0osQ0FBQyxDQUFBO0tBRUwsQ0FBQzs7QUFHTCxXQUFPLFFBQVEsQ0FBQztDQUNoQiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuKiBBbmd1bGFyIG1vZHVsZVxuKi9cblxudmFyIEFQUE5BTUUgPSBcImx1a2thcmlcIjtcblxuYW5ndWxhci5tb2R1bGUoQVBQTkFNRSwgWyd1aS5yb3V0ZXInLCduZ01hdGVyaWFsJ10pO1xuXG4vKlxuKiBVdGlsaXR5XG4gKi9cbkRhdGUucHJvdG90eXBlLmdldFdlZWsgPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgb25lamFuID0gbmV3IERhdGUodGhpcy5nZXRGdWxsWWVhcigpLCAwLCAxKTtcbiAgICByZXR1cm4gTWF0aC5jZWlsKCgoKHRoaXMgLSBvbmVqYW4pIC8gODY0MDAwMDApICsgb25lamFuLmdldERheSgpICsgMSkgLyA3KTtcbn07IiwiLypcclxuKlx0VUkgUm91dGVzXHJcbiovXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmNvbmZpZyhzdGF0ZXMsXCJzdGF0ZXNcIik7XHJcbnN0YXRlcy4kaW5qZWN0ID0gWyckc3RhdGVQcm92aWRlcicsICckdXJsUm91dGVyUHJvdmlkZXInXTtcclxuXHJcbmZ1bmN0aW9uIHN0YXRlcyAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcil7XHJcblx0XCJ1c2Ugc3RyaWN0XCI7XHJcblx0JHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcImZpbmRcIik7XHJcblx0dmFyIHJvdXRlID0gXCJcIjtcclxuXHQkc3RhdGVQcm92aWRlclxyXG5cdC5zdGF0ZShcImZpbmRcIix7XHJcblx0IFx0dXJsOlwiL2ZpbmRcIixcclxuXHQgXHR0ZW1wbGF0ZVVybDogXCIvYXBwL2ZpbmQvZmluZC5odG1sXCJcclxuXHR9KSBcclxuXHQuc3RhdGUoXCJzY2hlZHVsZVwiLHtcclxuXHQgXHR1cmw6cm91dGUrXCIvc2NoZWR1bGVcIixcclxuXHQgXHR0ZW1wbGF0ZVVybDogXCIvYXBwL3NjaGVkdWxlL3NjaGVkdWxlLmh0bWxcIlxyXG5cdH0pXHJcblx0XHQuc3RhdGUoXCJzY2hlZHVsZS5jYW1wdXNcIix7XHJcblx0XHRcdHVybDpyb3V0ZStcIi86Y2FtcHVzXCIsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiBcIi9hcHAvc2NoZWR1bGUvc2NoZWR1bGUuaHRtbFwiXHJcblx0XHR9KVxyXG5cdFx0XHQuc3RhdGUoXCJzY2hlZHVsZS5jbGFzc1wiLHtcclxuXHRcdFx0XHR1cmw6cm91dGUrXCIvOmNOYW1lXCIsXHJcblx0XHRcdFx0dGVtcGxhdGVVcmw6IFwiL2FwcC9zY2hlZHVsZS9zY2hlZHVsZS5odG1sXCJcclxuXHRcdFx0fSlcclxuXHRcdFx0XHQuc3RhdGUoXCJzY2hlZHVsZS5jbGFzcy53ZWVrXCIse1xyXG5cdFx0XHRcdFx0dXJsOnJvdXRlK1wiLzp3blwiLFxyXG5cdFx0XHRcdFx0dGVtcGxhdGVVcmw6XCIvYXBwL3NjaGVkdWxlL3NjaGVkdWxlLmh0bWxcIlxyXG5cdFx0XHRcdH0pXHJcblxyXG59XHJcbiIsIlxyXG4vKipcclxuKiBBdXRvIGZpbGwgfCBOb3RlIHRoaXMgaXMgcmVkdW5kYW50IHNpbmNlIHdlJ3JlIHVzaW5nIG5nLW1hdGVyaWFsXHJcbiogQGRlc2MgKkF1dG8gZmlsbHMgc2VhcmNoZXMqXHJcbiogQHBhcmFtOiBhdXRvLWZpbGwtdm06IHZtIHRvIHRhcmdldFxyXG4qIEBwYXJhbTogYXV0by1maWxsLXNyYzogYSBwcm9wZXJ0eSBvZiB2bSB0byBzZWFyY2hcclxuKiBAcGFyYW06IGF1dG8tZmlsbC1rZXlzOiBrZXlzIHRvIHNlYXJjaCBpbiBzcmMgfCBzdHJpbmcgb3IgYXJyYXlcclxuKiBAcGFyYW06IGF1dG8tZmlsbC1jYjogZnVuY3Rpb24gdG8gZXhlY3V0ZSBvbiB1c2VyIGFjdGlvbiwgcGFzc2VkIHRoZSBrZXkgYW5kIGl0J3MgcGF0aCBmb3VuZFxyXG4qL1xyXG5cclxuYW5ndWxhci5tb2R1bGUoQVBQTkFNRSkuZGlyZWN0aXZlKFwiYXV0b0ZpbGxcIixhdXRvRmlsbCk7XHJcblxyXG5hdXRvRmlsbC4kaW5qZWN0ID0gW1wiJGNvbXBpbGVcIl07XHJcblxyXG5mdW5jdGlvbiBhdXRvRmlsbCgkY29tcGlsZSl7XHJcblxyXG5cdHJldHVybntcclxuXHRcdHNjb3BlOlwiPVwiLFxyXG5cdFx0bGluazpsaW5rRnVuYyxcclxuXHRcdHRlbXBsYXRlOlwiXCIsXHJcblx0XHRyZXN0cmljdDpcIkVcIlxyXG5cdH07XHJcblxyXG5cdGZ1bmN0aW9uIGxpbmtGdW5jKHNjb3BlLGVsZW1lbnQsYXR0cnMpIHtcclxuXHJcbiAgICAgICAgbGV0IHZtID0gc2NvcGVbYXR0cnMuYXV0b0ZpbGxWbV07XHJcbiAgICAgICAgbGV0IGtleXM7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGtleXNaKCkge1xyXG4gICAgICAgICAgICBrZXlzID0gYXR0cnMuYXV0b0ZpbGxLZXlzLnNwbGl0KFwiLFwiKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBrZXlzWigpO1xyXG5cclxuXHJcblxyXG4gICAgICAgIC8vc2NvcGUub3V0cHV0cyA9WzAsMCwwLDAsMCwwLDAsMCwwLDBdO1xyXG4gICAgICAgIC8vIGxldCBzcmMgPSB2bVthdHRycy5hdXRvRmlsbFZtU3JjXTtcclxuICAgICAgICAvLyBsZXQgY2IgPSB2bVthdHRycy5hdXRvRmlsbENiXTtcclxuXHJcbiAgICAgICAgbGV0IHRhcmdldEFyciA9IFtdO1xyXG4gICAgICAgIHNjb3BlLnNlYXJjaE1vZGVsID0gW107XHJcbiAgICAgICAgaWYgKCF0YXJnZXRBcnIubGVuZ3RoKSBtYXAoKTtcclxuXHJcbiAgICAgICAgbGV0IGluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGxldCBlbCA9IFwiPGRpdiBuZy1jbGljaz0nc2VhcmNoVGhpcygpJyBjbGFzcz0nc2VhcmNoJz5cIiArXHJcbiAgICAgICAgICAgICAgICBcIjxpbnB1dCBjbGFzcz0nZGF0YS1zZWFyY2gnIHR5cGU9J3RleHQnIG5nLW1vZGVsPSdzZWFyY2hNb2RlbCcgbmctY2hhbmdlPSdpbnB1dENoYW5nZWQoKSc+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdzZWFyY2gtb3V0cHV0Jz48ZGl2IGNsYXNzPSdpdGVtIGl0ZW0tbGFiZWwgc2VhcmNoLW91dHB1dC1zaW5nbGUnIG5nLXJlcGVhdD0nc2VhcmNoT3V0cHV0IGluIG91dHB1dHMgdHJhY2sgYnkgJGluZGV4JyA+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8c3BhbiBuZy1jbGljaz0nYWN0aXZhdGVTZWFjaE91dHB1dChzZWFyY2hPdXRwdXQpJyBjbGFzcz0nJz57e3NlYXJjaE91dHB1dC5uYW1lfX08L3NwYW4+PC9kaXY+PC9kaXY+PC9kaXY+XCI7XHJcblxyXG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZCgkY29tcGlsZShlbCkoc2NvcGUpKVxyXG4gICAgICAgIH0oKTtcclxuXHJcbiAgICAgICAgLy9FdmVudCBsaXN0ZW5lcnNcclxuICAgICAgIC8qIHNjb3BlLnNlYXJjaFRoaXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYXR0cnMsIGF0dHJzLmF1dG9GaWxsVm1UYXJnZXQpXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coc3JjLGF0dHJzLmF1dG9GaWxsVm1TcmMsIHZtW2F0dHJzLmF1dG9GaWxsVm1TcmNdKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJzZWFyY2hcIiwgdm0pO1xyXG5cclxuICAgICAgICB9OyovXHJcbiAgICAgICAgc2NvcGUuaW5wdXRDaGFuZ2VkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiaW5wdXQhIHZhbHVlOlwiLCBzY29wZS5zZWFyY2hNb2RlbCk7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0QXJyLmxlbmd0aCkgbWFwKCk7XHJcbiAgICAgICAgICAgIHNlYXJjaEJ5TW9kZWwoKTtcclxuICAgICAgICAgICAgdm0uc2VhY2hNb2RlbCA9ICBzY29wZS5zZWFjaE1vZGVsO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5wdXQhIHZhbHVlOlwiLCBzY29wZS5vdXRwdXRzKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHNjb3BlLmFjdGl2YXRlU2VhY2hPdXRwdXQgPSBmdW5jdGlvbih2YWwpe1xyXG4gICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiaW5wdXQhIHZhbHVlOlwiLCB2YWwpO1xyXG4gICAgICAgICAgICBzY29wZS5zZWFjaE1vZGVsID0gdmFsO1xyXG4gICAgICAgICAgICB2bS5zZWFjaE1vZGVsID0gdmFsO1xyXG4gICAgICAgICAgICBlbGVtZW50LmZpbmQoXCJpbnB1dFwiKVswXS52YWx1ZSA9IHZhbC5uYW1lO1xyXG4gICAgICAgICAgICBzY29wZS5vdXRwdXRzID0gW107XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJpbnB1dCEgdmFsdWU6XCIsIGVsZW1lbnQuZmluZChcImlucHV0XCIpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFNlYXJjaCBmdW5jdGlvblxyXG4gICAgICAgICAqIElmIHRoZSBrZXlzIGFyZSBhbiBhcnJheSBmaW5kIGVhY2hcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBtYXAoKSB7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGtleXMsIGtleXMgaW5zdGFuY2VvZiBBcnJheSlcclxuICAgICAgICAgICAgaWYgKGtleXMgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJrZXlzXCIsa2V5c1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzaW9uKHZtW2F0dHJzLmF1dG9GaWxsVm1TcmNdLCBrZXlzW2ldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHJlY3Vyc2lvbih2bVthdHRycy5hdXRvRmlsbFZtU3JjXSwga2V5cyk7XHJcblxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgKiBSZWN1cnNpb24gZnVuY3Rpb25cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlY3Vyc2lvbihhcnIsIHByb3ApIHtcclxuICAgICAgICAgICAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBBcnJheSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJyW2ldIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2xheWVycy5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaW9uKGFycltpXSwgcHJvcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYXJyW2ldW3Byb3BdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2xheWVycy5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0QXJyLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6YXJyW2ldW3Byb3BdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOmFycltpXS5faWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJrZXkgZm91bmRcIiwgdGFyZ2V0QXJyW2ldLGFycltpXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhcnIgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gYXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IHByb3ApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRBcnIucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTphcnJbcHJvcF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6YXJyLl9pZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwia2V5IGZvdW5kXCIsIGtleSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJyW2tleV0gaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYXllcnMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaW9uKGFycltrZXldLCBwcm9wKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3VzZXIgYWN0aXZhdGVkIHNlYXJjaFxyXG4gICAgICAgIC8vc2VhcmNoTW9kZWwgbm93IGhhcyBuZXcgdmFsXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHNlYXJjaEJ5TW9kZWwoKSB7XHJcbiAgICAgICAgICAgIGlmICghc2NvcGUuc2VhcmNoTW9kZWwubGVuZ3RoKXtcclxuICAgICAgICAgICAgICAgIHNjb3BlLm91dHB1dHNBY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzY29wZS5vdXRwdXRzID0gW107XHJcblxyXG4gICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVsZW1lbnQuZmluZChcImRpdlwiKSlcclxuICAgICAgICAgICAgZmluZFRhcmdldCgpO1xyXG4gICAgICAgICAgICBmb3JtYXRUYXJnZXQoKTtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZmluZFRhcmdldCgpIHtcclxuICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8dGFyZ2V0QXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGZpbmRTaW1wbGUodGFyZ2V0QXJyW2ldKT4tMSkgc2NvcGUub3V0cHV0cy5wdXNoKHRhcmdldEFycltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoc2NvcGUub3V0cHV0cy5sZW5ndGggPj0xMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmdW5jdGlvbiBmb3JtYXRUYXJnZXQoKXtcclxuICAgICAgICAgICAgICAgIHRhcmdldEFyci5zb3J0KGZ1bmN0aW9uKGEsYil7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbmRTaW1wbGUoYSkgLSBmaW5kU2ltcGxlKGIpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmdW5jdGlvbiBmaW5kU2ltcGxlKGEpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc2NvcGUuc2VhcmNoTW9kZWwudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cdH1cclxufSIsIi8qKlxyXG4qIERhdGEgRmFjdG9yeVxyXG4qIEBkZXNjIGNvbW11bmljYXRlcyB3aXRoIHRoZSBhcGksIHJldHVybnMgcHJvbWlzZXMgb2YgZGF0YVxyXG4qL1xyXG5cclxuYW5ndWxhci5tb2R1bGUoQVBQTkFNRSkuZmFjdG9yeShcImRhdGFGYWN0XCIsZGF0YUZhY3QpO1xyXG5cclxuZGF0YUZhY3QuJGluamVjdCA9IFtcImh0dHBGYWN0LCAkcSwgJHRpbWVvdXRcIl07XHJcblxyXG5mdW5jdGlvbiBkYXRhRmFjdChodHRwRmFjdCwgJHEsICR0aW1lb3V0KXtcclxuXHJcbiAgICAvL3RoaXNcclxuXHRsZXQgZGF0YUYgPSB7fTtcclxuXHJcbiAgICAvL2RhdGEgd2UncmUgc2VydmluZ1xyXG4gICAgZGF0YUYuY2FtcHVzZXMgPSBbXTtcclxuICAgIGRhdGFGLndlZWtzID0gW107XHJcblxyXG4gICAgLy91c2VkIHRvIHBhcnNlIHRoZSB3ZWVrIG51bVxyXG4gICAgbGV0IGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgIC8vY2hlY2sgdGhlc2UgaW4gZ2V0dGVyc1xyXG4gICAgLy9pZiBkYXRhIG5vdCB5ZXQgbG9hZGVkIGZyb20gQVBJICgpPT4gdGhhdCdzIGEgcGFkZGxpbidcclxuICAgIGxldCBwcm9taXNlcyA9e1xyXG4gICAgICAgIGNhbXB1c2VzIDogZmFsc2UsXHJcbiAgICAgICAgY2xhc3NlcyA6IGZhbHNlLFxyXG4gICAgICAgIHdlZWtzOmZhbHNlXHJcbiAgICB9O1xyXG5cclxuICAgIC8vUHVibGljIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBHZXQgY2FtcHVzZXMgZGF0YSBmcm9tIEFQSVxyXG4gICAgICovXHJcbiAgICBkYXRhRi5pbml0ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkRhdGEgZmFjdG9yeSBpbml0aWFsaXplZCwgZ2V0dGluZyBkYXRhXCIpXHJcbiAgICAgICAgaHR0cEZhY3QuZ2V0KFwiL2NhbXB1c1wiKS50aGVuKChkKT0+e1xyXG4gICAgICAgICAgICBkYXRhRi5jYW1wdXNlcyA9IGQuZGF0YTtcclxuICAgICAgICAgICAgcHJvbWlzZXMuY2FtcHVzZXMgPSB0cnVlO1xyXG4gICAgICAgICAgICBkYXRhRi5pbml0Q2xhc3NlcygpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKChlcnIpPT57XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImVyckBkYXRhZmFjdCBjYW1wdXNcIixlcnIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKlxyXG4gICAgKiBHZXQgY2xhc3NlcyBkYXRhIGZyb20gQVBJXHJcbiAgICAgKi9cclxuICAgIGRhdGFGLmluaXRDbGFzc2VzID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgLy9Bc3luYyBzdGVwIGZ1bmNcclxuICAgICAgICBmdW5jdGlvbiBzdGVwKGkpIHtcclxuICAgICAgICAgICAgaHR0cEZhY3QuZ2V0KFwiL2NhbXB1cy9cIiArIGVuY29kZVVSSShkYXRhRi5jYW1wdXNlc1tpXS5uYW1lKSArIFwiL2NsYXNzZXNcIikudGhlbigoZCk9PiB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZUNhbXB1c2VzKGQuZGF0YSwgXCJjbGFzc2VzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYoaTxkYXRhRi5jYW1wdXNlcy5sZW5ndGgtMSkgc3RlcChpKz0xKTtcclxuICAgICAgICAgICAgICAgIGVsc2V7ICAgLy9DbGFzc2VzIGRvbmVcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNsYXNzZXMgZG9uZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5jbGFzc2VzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhRi5pbml0V2Vla3MoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ZXAoMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBHZXQgd2Vla3MgZGF0YSBmcm9tIEFQSVxyXG4gICAgICovXHJcbiAgICBkYXRhRi5pbml0V2Vla3MgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAvL0FzeW5jIHN0ZXAgZnVuY1xyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAoaSkge1xyXG4gICAgICAgICAgICBodHRwRmFjdC5nZXQoXCIvY2FtcHVzL1wiICsgZW5jb2RlVVJJKGRhdGFGLmNhbXB1c2VzW2ldLm5hbWUpICsgXCIvd2Vla3NcIikudGhlbigoZCk9PiB7XHJcbiAgICAgICAgICAgICAgICBkYXRhRi53ZWVrcy5wdXNoKGQuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBpZihpPGRhdGFGLmNhbXB1c2VzLmxlbmd0aC0xKSBzdGVwKGkrPTEpO1xyXG4gICAgICAgICAgICAgICAgZWxzZXsgLy93ZWVrcyBkb25lXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMud2Vla3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwid2Vla3MgZG9uZVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ZXAoMCk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgLypcclxuICAgICBHZXR0ZXJzXHJcbiAgICAgKi9cclxuXHJcbiAgICAgLyoqXHJcbiAgICAgKiBQYXJzZSBhIHdlZWsncyBkYXRhIGJhc2VkIG9uIHNlbGVjdGVkIGRhdGUgJiBjbGFzcyBuYW1lXHJcbiAgICAgKiBAcGFyYW0gc2VhY2hNb2RlbCBvYmogLSAud2Vla051bWJlcjogLm5hbWU6IFxyXG4gICAgICovXHJcbiAgICBkYXRhRi5nZXRXZWVrRGF0YSA9IGZ1bmN0aW9uKHNlYWNoTW9kZWwpe1xyXG5cclxuICAgICAgICBsZXQgdyA9IG5ldyBEYXRlKGRhdGUpLmdldFdlZWsoKTtcclxuXHJcbiAgICAgICAgLy9XZWVrcyA9IGFsbCBjYW1wdXNlcyBhbGwgd2Vla3NcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZGF0YUYud2Vla3MubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIC8vV2Vla3NbaV0gPSBhbGwgd2Vla3MgZnJvbSAxIGNhbXB1c1xyXG4gICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZGF0YUYud2Vla3NbaV0ubGVuZ3RoO2orKyl7XHJcbiAgICAgICAgICAgICAgICAvL1dlZWtzW2ldW2pdID0gZGF0YSBmcm9tIDEgd2Vla3MgZnJvbSAxIGNhbXB1c1xyXG4gICAgICAgICAgICAgICAgLy9IYXMgY2xhc3M6YXNkYXNkICwgd2Vla051bWJlcjo0OVxyXG4gICAgICAgICAgICAgICAgaWYoZGF0YUYud2Vla3NbaV1bal0uY2xhc3M9PT1zZWFjaE1vZGVsLmNsYXNzJiZkYXRhRi53ZWVrc1tpXVtqXS53ZWVrTnVtYmVyPT09dyl7XHJcbiAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWF0Y2ghXCIsZGF0YUYud2Vla3NbaV1bal0sdyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YUYud2Vla3NbaV1bal0ubmFtZSA9IHNlYWNoTW9kZWwubmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFGLndlZWtzW2ldW2pdO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qXHJcbiAgICAqIENhbXB1cyB8IENsYXNzIHwgV2Vla1xyXG4gICAgKiBJZiBkYXRhIG5vdCB5ZXQgbG9hZGVkIHJlc29sdmUsIHdhaXQgYSBzZWMsIGlmIHN0aWxsIG5vdCByZWplY3RcclxuICAgICAqL1xyXG4gICAgZGF0YUYuZ2V0Q2FtcHVzID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUsIHJlamVjdCk9PntcclxuICAgICAgICAgICAgY2hlY2tGb3JTdGF0dXNSZXR1cm5Qcm9taXNlKFwiY2FtcHVzZXNcIixcImNhbXB1c2VzXCIsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgZGF0YUYuZ2V0Q2FtcHVzRGF0YSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuICRxKChyZXNvbHZlLCByZWplY3QpPT57XHJcbiAgICAgICAgICAgIGNoZWNrRm9yU3RhdHVzUmV0dXJuUHJvbWlzZShcImNsYXNzZXNcIixcImNhbXB1c2VzXCIsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgZGF0YUYuZ2V0Q2FtcHVzV2Vla3MgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiAkcSgocmVzb2x2ZSwgcmVqZWN0KT0+e1xyXG4gICAgICAgICAgICBjaGVja0ZvclN0YXR1c1JldHVyblByb21pc2UoXCJ3ZWVrc1wiLFwid2Vla3NcIiwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gYSB3ZWVrIHNjaGVkdWxlXHJcbiAgICAgKiBOb3RlIHRoYXQgd2UgY2FudCByZXR1cm4gc29tZXRoaW5nIHdlIGRvbid0IGhhdmUgLT4gbWFrZSBzdXJlIHdlIGhhdmUgdGhlIGRhdGEgZmlyc3QsIHRoZW4gcGFyc2VcclxuICAgICAqIEBwYXJhbSBjdXJyZW50QnlTdGF0ZSAtIG9iajogd2VlayBudW1iZXIsIGNsYXNzIG5hbWUgT1BUSU9OQUwgY2xhc3MgaWRcclxuICAgICAqIEByZXR1cm4gcHJvbWlzZSBvZiBkYXRhXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICBkYXRhRi5nZXRTY2hlZHVsZSA9IGZ1bmN0aW9uKGN1cnJlbnRCeVN0YXRlKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUsIHJlamVjdCk9PntcclxuXHJcbiAgICAgICAgICAgIGxldCByZXR1cm5WYWw7XHJcbiAgICAgICAgICAgIGlmKHByb21pc2VzLndlZWtzKSBtYWluTG9vcCgpO1xyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoKCk9PntcclxuICAgICAgICAgICAgICAgICAgICBpZihwcm9taXNlcy53ZWVrcykgbWFpbkxvb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHJlamVjdChcIkFQSSB1bmF2YWlsYWJsZSBhdCB0aGlzIHRpbWUsIHNvIHNvcnJ5XCIpXHJcbiAgICAgICAgICAgICAgICB9LDUwMDApXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIG1haW5Mb29wKCl7XHJcbiAgICAgICAgICAgICAgICBpZighY3VycmVudEJ5U3RhdGUuY2xhc3NJZCkgZ2V0Q2xhc3NEYXRhKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjdXJyZW50QnlTdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGdldFdlZWtEYXRhU2NoZWR1bGUoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vcHJpdmF0ZSBtYXBwaW5nIGZ1bmN0aW9uLCBmaW5kIGNsYXNzIGlkIGJ5IG5hbWVcclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0Q2xhc3NEYXRhKCl7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8IGRhdGFGLmNhbXB1c2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaiA9IDA7ajxkYXRhRi5jYW1wdXNlc1tpXS5jbGFzc2VzLmxlbmd0aDtqKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YUYuY2FtcHVzZXNbaV0uY2xhc3Nlc1tqXS5uYW1lID09PSBjdXJyZW50QnlTdGF0ZS5uYW1lKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRCeVN0YXRlLmNsYXNzSWQgPSBkYXRhRi5jYW1wdXNlc1tpXS5jbGFzc2VzW2pdLl9pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0V2Vla0RhdGFTY2hlZHVsZSgpe1xyXG4gICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhRi53ZWVrcyk7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZGF0YUYud2Vla3MubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGRhdGFGLndlZWtzW2ldLmxlbmd0aDtqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFGLndlZWtzW2ldW2pdLmNsYXNzID09PSBjdXJyZW50QnlTdGF0ZS5jbGFzc0lkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhRi53ZWVrc1tpXVtqXS5uYW1lID0gY3VycmVudEJ5U3RhdGUubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhRi53ZWVrc1tpXVtqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL1ByaXZhdGVcclxuICAgIC8qXHJcbiAgICAqIElmIGRhdGEgbm90IHlldCBsb2FkZWQgcmVzb2x2ZSwgd2FpdCBhIHNlYywgaWYgc3RpbGwgbm90IHJlamVjdFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclN0YXR1c1JldHVyblByb21pc2UocCwgZGF0YSwgcmVzb2x2ZSwgcmVqZWN0KXtcclxuICAgICAgICBpZihwcm9taXNlc1twXSkgcmVzb2x2ZShkYXRhRltkYXRhXSk7XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgJHRpbWVvdXQoKCk9PntcclxuICAgICAgICAgICAgICAgIGlmKHByb21pc2VzW3BdKSByZXNvbHZlKGRhdGFGW2RhdGFdKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgcmVqZWN0KFwiQVBJIHVuYXZhaWxhYmxlIGF0IHRoaXMgdGltZSwgc28gc29ycnlcIilcclxuICAgICAgICAgICAgfSw1MDAwKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgKiBBc3NpZ24gYSBjYW1wdXMgaXQncyBjbGFzc2VzXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlQ2FtcHVzZXMoZGF0YSwgayl7XHJcbiAgICAgICAgZm9yKGxldCBqID0gMDtqPGRhdGFGLmNhbXB1c2VzLmxlbmd0aDtqKyspe1xyXG4gICAgICAgICAgICBpZihkYXRhRi5jYW1wdXNlc1tqXS5faWQgPT09IGRhdGFbMF0uY2FtcHVzKXtcclxuICAgICAgICAgICAgICAgIGRhdGFGLmNhbXB1c2VzW2pdW2tdID0gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkYXRhRi5pbml0KCk7IC8vc2luZ2xldG9ucyA8M1xyXG5cdHJldHVybiBkYXRhRjtcclxufVxyXG5cclxuXHJcbiIsIi8qXHJcbiogRmluZCBDb250cm9sbGVyXHJcbiovXHJcblxyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FKS5jb250cm9sbGVyKFwiZmluZEN0cmxcIixmaW5kQ3RybCk7XHJcblxyXG5maW5kQ3RybC4kaW5qZWN0ID0gW1wiZGF0YUZhY3Qsc2NoZWR1bGVGYWN0LCAkc3RhdGVcIl07XHJcblxyXG5mdW5jdGlvbiBmaW5kQ3RybChkYXRhRmFjdCxzY2hlZHVsZUZhY3QsICRzdGF0ZSl7XHJcblxyXG4gICAgLy90aGlzXHJcbiAgICBsZXQgdm0gPSB0aGlzO1xyXG5cclxuICAgIC8vSU5JVFxyXG4gICAgLy9nZXQgY2FtcHVzICYgY2xhc3NlcyBkYXRhXHJcbiAgICAoZnVuY3Rpb24oKXtcclxuICAgICAgICBkYXRhRmFjdC5nZXRDYW1wdXNEYXRhKCkudGhlbigoZGF0YSk9PntcclxuICAgICAgICAgICAgdm0uY2FtcHVzZXMgPSBkYXRhO1xyXG5cclxuICAgICAgICB9KS5jYXRjaCgoZXJyKT0+e1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycilcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9KSgpO1xyXG5cclxuICAgIC8vRXZlbnQgbGlzdGVuZXJzXHJcbiAgICAvL1RIRSBGSU5EIEFDVElPTlxyXG4gICAgdm0uZmluZFNjaGVkdWxlID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2codm0uc2VhY2hNb2RlbCk7XHJcbiAgICAgICAgLy9GaW5kIHdlZWsgYW5kIHNldCBhcyBhY3RpdmVcclxuICAgICAgICBsZXQgdyA9IGRhdGFGYWN0LmdldFdlZWtEYXRhKHZtLnNlYWNoTW9kZWwpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHcpO1xyXG4gICAgICAgIHNjaGVkdWxlRmFjdC5zZXRTY2hlZHVsZSh3KTtcclxuICAgICAgICAvL2dvdG9cclxuICAgICAgICAkc3RhdGUuZ28oXCJzY2hlZHVsZS5jbGFzcy53ZWVrXCIsIHtcclxuICAgICAgICAgICAgY05hbWU6ZW5jb2RlVVJJKHcubmFtZSksXHJcbiAgICAgICAgICAgIHduOmVuY29kZVVSSSh3LndlZWtOdW1iZXIpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxufVxyXG5cclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgYWRtaW4gb24gMjYuMTEuMjAxNS5cclxuICovXHJcbi8qXHJcbiogbmctZmFjdG9yeVxyXG4qL1xyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FKS5mYWN0b3J5KFwiaHR0cEZhY3RcIixodHRwRmFjdCk7XHJcblxyXG4vL2ZhY3RvcnlBLiRpbmplY3QgPSBbXCJcIl1cclxuXHJcbmZ1bmN0aW9uIGh0dHBGYWN0KCRodHRwKXtcclxuXHJcblx0bGV0IGh0dHBGID0ge307XHJcblxyXG4gICAgbGV0IGFwaUFkZHIgPSBcIi9hcGlcIjtcclxuXHJcbiAgICAvL3B1YmxpY1xyXG4gICAgLypcclxuICAgICogQSBzaW1wbGUgZ2V0IGZ1bmN0aW9uXHJcbiAgICAqIEBwYXJhbSByb3V0ZSBTdHJpbmdcclxuICAgICAqL1xyXG4gICAgaHR0cEYuZ2V0ID0gZnVuY3Rpb24ocm91dGUpe1xyXG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoYXBpQWRkcityb3V0ZSk7XHJcbiAgICB9O1xyXG5cclxuXHRyZXR1cm4gaHR0cEY7XHJcbn1cclxuXHJcblxyXG4iLCIvKlxyXG4qICAgU2NoZWR1bGVzIENvbnRyb2xsZXJcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmNvbnRyb2xsZXIoXCJzY2hlZHVsZUN0cmxcIixzY2hlZHVsZUN0cmwpO1xyXG5cclxuc2NoZWR1bGVDdHJsLiRpbmplY3QgPSBbXCJzY2hlZHVsZUZhY3RcIl07XHJcblxyXG5mdW5jdGlvbiBzY2hlZHVsZUN0cmwoc2NoZWR1bGVGYWN0KXtcclxuXHJcbiAgICAvL3RoaXNcclxuICAgIGxldCB2bSA9IHRoaXM7XHJcblxyXG4gICAgLy9nZXQgdGhpcyBzY2hlZHVsZSBmcm9tIGZhY3RcclxuICAgIHNjaGVkdWxlRmFjdC5nZXRTY2hlZHVsZSgpLnRoZW4oKGRhdGEpPT57XHJcbiAgICAgICAgZGF0YS5zY2hlZHVsZSA9IHBhcnNlU2NoZWR1bGVzKGRhdGEuc2NoZWR1bGUpO1xyXG4gICAgICAgIHZtLnNjaGVkdWxlSXRlbSA9ZGF0YTtcclxuICAgICAgICBjb25zb2xlLmxvZyh2bS5zY2hlZHVsZUl0ZW0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy9wYXJzZSBzY2hlZHVsZSBhcnIgdG8gbW9hciBzdWl0YWJsZSBmb3JtXHJcbiAgICBmdW5jdGlvbiBwYXJzZVNjaGVkdWxlcyhkKXtcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZC5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGRbaV0uc2xvdHMubGVuZ3RoO2orKyl7XHJcbiAgICAgICAgICAgICAgLy8gIGRbaV0uc2xvdHNbal0udGV4dCA9IGRbaV0uc2xvdHNbal0udGV4dC5yZXBsYWNlKC9cXHMqQGJyQFxccyovZ2ksXCImbmJzcDtcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbiIsIi8qKlxyXG4gKiBTY2hlZHVsZSBmYWN0b3J5XHJcbiAqIEBkZXNjIHN0b3JlIHNjaGVkdWxlIGRhdGEsIGdldCBvbmUgaWYgbm90IGV4aXRzXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FKS5mYWN0b3J5KFwic2NoZWR1bGVGYWN0XCIsc2NoZWR1bGVGYWN0KTtcclxuXHJcbnNjaGVkdWxlRmFjdC4kaW5qZWN0ID0gW1wiJHN0YXRlUGFyYW1zLCBkYXRhRmFjdCwgJHFcIl07XHJcblxyXG5mdW5jdGlvbiBzY2hlZHVsZUZhY3QoJHN0YXRlUGFyYW1zLCBkYXRhRmFjdCwgJHEpe1xyXG5cclxuICAgIC8vdGhpc1xyXG5cdGxldCBzY2hlZHVsZSA9IHt9O1xyXG5cclxuICAgIC8vdGhlIG9uZSB3ZSdyZSBzZXJ2aW5nIHRvIHRoZSBjb250cm9sbGVyXHJcbiAgICBsZXQgYWN0aXZlU2NoZWR1bGUgPXtcclxuICAgICAgICB3ZWVrTnVtYmVyOiBudWxsLFxyXG4gICAgICAgIG5hbWU6IG51bGxcclxuICAgIH07XHJcblxyXG4gICAgbGV0IGN1cnJlbnRCeVN0YXRlID0ge307XHJcblxyXG4gICAgLy9hcmUgd2Ugc3VyZSB0aGF0IHRoZSBzY2hlZHVsZSBpcyB0aGUgcmlnaHQgb25lP1xyXG4gICAgbGV0IGNvbXBsZXRlO1xyXG5cclxuICAgIC8vUHJpdmF0ZSBmdW5jdGlvbnNcclxuXHJcbiAgICAvKipcclxuICAgICogUGFyc2Ugc3RhdGUgcGFyYW1zIC0gZG8gdGhleSBtYXRjaCB0aGUgc2NoZWR1bGUgd2UgaGF2ZT9cclxuICAgICogSWYgIW1hdGNoIHx8IHdlIGRvbid0IGhhdmUgYSBzY2hlZHVsZVxyXG4gICAgKiAgIEdldCB0aGUgY29ycmVjdCBvbmUgZm9yIGRhdGFmYWN0IGFjY29yZGluZyB0byBzdGF0ZXBhcmFtc1xyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBwYXJzZVN0YXRlKCkge1xyXG4gICAgICAgIGN1cnJlbnRCeVN0YXRlLndlZWtOdW1iZXIgPSAkc3RhdGVQYXJhbXMud247XHJcbiAgICAgICAgY3VycmVudEJ5U3RhdGUubmFtZSA9ICRzdGF0ZVBhcmFtcy5jTmFtZTtcclxuICAgICAgICBpZihjdXJyZW50QnlTdGF0ZS53ZWVrTnVtYmVyPT09YWN0aXZlU2NoZWR1bGUud2Vla051bWJlciYmY3VycmVudEJ5U3RhdGUubmFtZT09PWFjdGl2ZVNjaGVkdWxlLm5hbWUpIGNvbXBsZXRlID0gdHJ1ZTtcclxuLyogICAgICAgIGVsc2UgZGF0YUZhY3QuZ2V0U2NoZWR1bGUoY3VycmVudEJ5U3RhdGUpLnRoZW4oKGRhdGEpPT57XHJcblxyXG4gICAgICAgIH0pOyovXHJcbiAgICB9XHJcblxyXG4gICAgLy9QdWJsaWMgZnVuY3Rpb25zXHJcblxyXG4gICAgLy9TZXR0ZXJzICYgR2V0dGVyc1xyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG9ialxyXG4gICAgICovXHJcbiAgICBzY2hlZHVsZS5zZXRTY2hlZHVsZSA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgYWN0aXZlU2NoZWR1bGUgPSBvYmo7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICpAZGVzYyBHZXQgdGhlIHNjaGVkdWxlIHdlJ3JlIHVzaW5nXHJcbiAgICAgKiBAcmV0dXJuIHByb21pc2UsIHRoZW4gdGhlIGRhdGFcclxuICAgICAqICBpZiB3ZSBkb24ndCBoYXZlIGl0IHdlJ2xsIGhhdmUgdG8gcGFyc2UgaXQgZnJvbSBzdGF0ZXBhcmFtc1xyXG4gICAgICogICAgICBhbmQgdGhlIGdldCBpZiBmcm9tIHRoZSBkYXRhIGZhY290cnlcclxuICAgICAqL1xyXG4gICAgc2NoZWR1bGUuZ2V0U2NoZWR1bGUgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiAkcSgocmVzb2x2ZSxyZWplY3QpPT57XHJcblxyXG4gICAgICAgICAgICBwYXJzZVN0YXRlKCk7XHJcbiAgICAgICAgICAgIGlmKGNvbXBsZXRlKSByZXNvbHZlKGFjdGl2ZVNjaGVkdWxlKTtcclxuXHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICBkYXRhRmFjdC5nZXRTY2hlZHVsZShjdXJyZW50QnlTdGF0ZSkudGhlbigoc2NoKT0+e1xyXG4gICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlLnNldFNjaGVkdWxlKHNjaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhY3RpdmVTY2hlZHVsZSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnIpPT57XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShlcnIpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICB9O1xyXG5cclxuXHJcblx0cmV0dXJuIHNjaGVkdWxlO1xyXG59XHJcblxyXG5cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
