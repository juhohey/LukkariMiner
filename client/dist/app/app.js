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
                d[i].slots[j].text = d[i].slots[j].text.replace(/\s*@br@\s*/gi, "@");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbmZpZy5qcyIsImF1dG9maWxsL2F1dG9GaWxsLmpzIiwiZGF0YS9kYXRhRmFjdC5qcyIsImZpbmQvZmluZEN0cmwuanMiLCJIdHRwL2h0dHBGYWN0LmpzIiwic2NoZWR1bGUvc2NoZWR1bGVDdHJsLmpzIiwic2NoZWR1bGUvc2NoZWR1bGVGYWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUlBLElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQzs7QUFFeEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUMsWUFBWSxDQUFDLENBQUM7Ozs7O0FBQUMsQUFLcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsWUFBVztBQUNoQyxRQUFJLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hELFdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEFBQUMsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFBLEdBQUksUUFBUSxHQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUEsR0FBSSxDQUFDLENBQUMsQ0FBQztDQUM5RSxDQUFDOzs7Ozs7QUNYRixPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUMsUUFBUSxDQUFDLENBQUM7QUFDaEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLGdCQUFnQixFQUFFLG9CQUFvQixDQUFDLENBQUM7O0FBRTFELFNBQVMsTUFBTSxDQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBQztBQUNuRCxhQUFZLENBQUM7O0FBQ2IsbUJBQWtCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3JDLEtBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLGVBQWMsQ0FDYixLQUFLLENBQUMsTUFBTSxFQUFDO0FB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QUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxHQUFHLEVBQUc7QUFDN0MsNEJBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDMUIsMkJBQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztpQkFDM0IsQ0FBQyxDQUNELEtBQUssQ0FBQyxVQUFDLEdBQUcsRUFBRztBQUNWLDJCQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7aUJBQ2YsQ0FBQyxDQUFBO2FBQ0w7U0FDSixDQUFDLENBQUE7S0FFTCxDQUFDOztBQUdMLFdBQU8sUUFBUSxDQUFDO0NBQ2hCIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiogQW5ndWxhciBtb2R1bGVcclxuKi9cclxuXHJcbnZhciBBUFBOQU1FID0gXCJsdWtrYXJpXCI7XHJcblxyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FLCBbJ3VpLnJvdXRlcicsJ25nTWF0ZXJpYWwnXSk7XHJcblxyXG4vKlxyXG4qIFV0aWxpdHlcclxuICovXHJcbkRhdGUucHJvdG90eXBlLmdldFdlZWsgPSBmdW5jdGlvbigpIHtcclxuICAgIGxldCBvbmVqYW4gPSBuZXcgRGF0ZSh0aGlzLmdldEZ1bGxZZWFyKCksIDAsIDEpO1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbCgoKCh0aGlzIC0gb25lamFuKSAvIDg2NDAwMDAwKSArIG9uZWphbi5nZXREYXkoKSArIDEpIC8gNyk7XHJcbn07IiwiLypcclxuKlx0VUkgUm91dGVzXHJcbiovXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmNvbmZpZyhzdGF0ZXMsXCJzdGF0ZXNcIik7XHJcbnN0YXRlcy4kaW5qZWN0ID0gWyckc3RhdGVQcm92aWRlcicsICckdXJsUm91dGVyUHJvdmlkZXInXTtcclxuXHJcbmZ1bmN0aW9uIHN0YXRlcyAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcil7XHJcblx0XCJ1c2Ugc3RyaWN0XCI7XHJcblx0JHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcImZpbmRcIik7XHJcblx0dmFyIHJvdXRlID0gXCJcIjtcclxuXHQkc3RhdGVQcm92aWRlclxyXG5cdC5zdGF0ZShcImZpbmRcIix7XHJcblx0IFx0dXJsOlwiL2ZpbmRcIixcclxuXHQgXHR0ZW1wbGF0ZVVybDogXCIvYXBwL2ZpbmQvZmluZC5odG1sXCJcclxuXHR9KSBcclxuXHQuc3RhdGUoXCJzY2hlZHVsZVwiLHtcclxuXHQgXHR1cmw6cm91dGUrXCIvc2NoZWR1bGVcIixcclxuXHQgXHR0ZW1wbGF0ZVVybDogXCIvYXBwL3NjaGVkdWxlL3NjaGVkdWxlLmh0bWxcIlxyXG5cdH0pXHJcblx0XHQuc3RhdGUoXCJzY2hlZHVsZS5jYW1wdXNcIix7XHJcblx0XHRcdHVybDpyb3V0ZStcIi86Y2FtcHVzXCIsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiBcIi9hcHAvc2NoZWR1bGUvc2NoZWR1bGUuaHRtbFwiXHJcblx0XHR9KVxyXG5cdFx0XHQuc3RhdGUoXCJzY2hlZHVsZS5jbGFzc1wiLHtcclxuXHRcdFx0XHR1cmw6cm91dGUrXCIvOmNOYW1lXCIsXHJcblx0XHRcdFx0dGVtcGxhdGVVcmw6IFwiL2FwcC9zY2hlZHVsZS9zY2hlZHVsZS5odG1sXCJcclxuXHRcdFx0fSlcclxuXHRcdFx0XHQuc3RhdGUoXCJzY2hlZHVsZS5jbGFzcy53ZWVrXCIse1xyXG5cdFx0XHRcdFx0dXJsOnJvdXRlK1wiLzp3blwiLFxyXG5cdFx0XHRcdFx0dGVtcGxhdGVVcmw6XCIvYXBwL3NjaGVkdWxlL3NjaGVkdWxlLmh0bWxcIlxyXG5cdFx0XHRcdH0pXHJcblxyXG59XHJcbiIsIlxyXG4vKipcclxuKiBBdXRvIGZpbGwgfCBOb3RlIHRoaXMgaXMgcmVkdW5kYW50IHNpbmNlIHdlJ3JlIHVzaW5nIG5nLW1hdGVyaWFsXHJcbiogQGRlc2MgKkF1dG8gZmlsbHMgc2VhcmNoZXMqXHJcbiogQHBhcmFtOiBhdXRvLWZpbGwtdm06IHZtIHRvIHRhcmdldFxyXG4qIEBwYXJhbTogYXV0by1maWxsLXNyYzogYSBwcm9wZXJ0eSBvZiB2bSB0byBzZWFyY2hcclxuKiBAcGFyYW06IGF1dG8tZmlsbC1rZXlzOiBrZXlzIHRvIHNlYXJjaCBpbiBzcmMgfCBzdHJpbmcgb3IgYXJyYXlcclxuKiBAcGFyYW06IGF1dG8tZmlsbC1jYjogZnVuY3Rpb24gdG8gZXhlY3V0ZSBvbiB1c2VyIGFjdGlvbiwgcGFzc2VkIHRoZSBrZXkgYW5kIGl0J3MgcGF0aCBmb3VuZFxyXG4qL1xyXG5cclxuYW5ndWxhci5tb2R1bGUoQVBQTkFNRSkuZGlyZWN0aXZlKFwiYXV0b0ZpbGxcIixhdXRvRmlsbCk7XHJcblxyXG5hdXRvRmlsbC4kaW5qZWN0ID0gW1wiJGNvbXBpbGVcIl07XHJcblxyXG5mdW5jdGlvbiBhdXRvRmlsbCgkY29tcGlsZSl7XHJcblxyXG5cdHJldHVybntcclxuXHRcdHNjb3BlOlwiPVwiLFxyXG5cdFx0bGluazpsaW5rRnVuYyxcclxuXHRcdHRlbXBsYXRlOlwiXCIsXHJcblx0XHRyZXN0cmljdDpcIkVcIlxyXG5cdH07XHJcblxyXG5cdGZ1bmN0aW9uIGxpbmtGdW5jKHNjb3BlLGVsZW1lbnQsYXR0cnMpIHtcclxuXHJcbiAgICAgICAgbGV0IHZtID0gc2NvcGVbYXR0cnMuYXV0b0ZpbGxWbV07XHJcbiAgICAgICAgbGV0IGtleXM7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGtleXNaKCkge1xyXG4gICAgICAgICAgICBrZXlzID0gYXR0cnMuYXV0b0ZpbGxLZXlzLnNwbGl0KFwiLFwiKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBrZXlzWigpO1xyXG5cclxuXHJcblxyXG4gICAgICAgIC8vc2NvcGUub3V0cHV0cyA9WzAsMCwwLDAsMCwwLDAsMCwwLDBdO1xyXG4gICAgICAgIC8vIGxldCBzcmMgPSB2bVthdHRycy5hdXRvRmlsbFZtU3JjXTtcclxuICAgICAgICAvLyBsZXQgY2IgPSB2bVthdHRycy5hdXRvRmlsbENiXTtcclxuXHJcbiAgICAgICAgbGV0IHRhcmdldEFyciA9IFtdO1xyXG4gICAgICAgIHNjb3BlLnNlYXJjaE1vZGVsID0gW107XHJcbiAgICAgICAgaWYgKCF0YXJnZXRBcnIubGVuZ3RoKSBtYXAoKTtcclxuXHJcbiAgICAgICAgbGV0IGluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGxldCBlbCA9IFwiPGRpdiBuZy1jbGljaz0nc2VhcmNoVGhpcygpJyBjbGFzcz0nc2VhcmNoJz5cIiArXHJcbiAgICAgICAgICAgICAgICBcIjxpbnB1dCBjbGFzcz0nZGF0YS1zZWFyY2gnIHR5cGU9J3RleHQnIG5nLW1vZGVsPSdzZWFyY2hNb2RlbCcgbmctY2hhbmdlPSdpbnB1dENoYW5nZWQoKSc+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdzZWFyY2gtb3V0cHV0Jz48ZGl2IGNsYXNzPSdpdGVtIGl0ZW0tbGFiZWwgc2VhcmNoLW91dHB1dC1zaW5nbGUnIG5nLXJlcGVhdD0nc2VhcmNoT3V0cHV0IGluIG91dHB1dHMgdHJhY2sgYnkgJGluZGV4JyA+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8c3BhbiBuZy1jbGljaz0nYWN0aXZhdGVTZWFjaE91dHB1dChzZWFyY2hPdXRwdXQpJyBjbGFzcz0nJz57e3NlYXJjaE91dHB1dC5uYW1lfX08L3NwYW4+PC9kaXY+PC9kaXY+PC9kaXY+XCI7XHJcblxyXG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZCgkY29tcGlsZShlbCkoc2NvcGUpKVxyXG4gICAgICAgIH0oKTtcclxuXHJcbiAgICAgICAgLy9FdmVudCBsaXN0ZW5lcnNcclxuICAgICAgIC8qIHNjb3BlLnNlYXJjaFRoaXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYXR0cnMsIGF0dHJzLmF1dG9GaWxsVm1UYXJnZXQpXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coc3JjLGF0dHJzLmF1dG9GaWxsVm1TcmMsIHZtW2F0dHJzLmF1dG9GaWxsVm1TcmNdKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJzZWFyY2hcIiwgdm0pO1xyXG5cclxuICAgICAgICB9OyovXHJcbiAgICAgICAgc2NvcGUuaW5wdXRDaGFuZ2VkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiaW5wdXQhIHZhbHVlOlwiLCBzY29wZS5zZWFyY2hNb2RlbCk7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0QXJyLmxlbmd0aCkgbWFwKCk7XHJcbiAgICAgICAgICAgIHNlYXJjaEJ5TW9kZWwoKTtcclxuICAgICAgICAgICAgdm0uc2VhY2hNb2RlbCA9ICBzY29wZS5zZWFjaE1vZGVsO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5wdXQhIHZhbHVlOlwiLCBzY29wZS5vdXRwdXRzKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHNjb3BlLmFjdGl2YXRlU2VhY2hPdXRwdXQgPSBmdW5jdGlvbih2YWwpe1xyXG4gICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiaW5wdXQhIHZhbHVlOlwiLCB2YWwpO1xyXG4gICAgICAgICAgICBzY29wZS5zZWFjaE1vZGVsID0gdmFsO1xyXG4gICAgICAgICAgICB2bS5zZWFjaE1vZGVsID0gdmFsO1xyXG4gICAgICAgICAgICBlbGVtZW50LmZpbmQoXCJpbnB1dFwiKVswXS52YWx1ZSA9IHZhbC5uYW1lO1xyXG4gICAgICAgICAgICBzY29wZS5vdXRwdXRzID0gW107XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJpbnB1dCEgdmFsdWU6XCIsIGVsZW1lbnQuZmluZChcImlucHV0XCIpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFNlYXJjaCBmdW5jdGlvblxyXG4gICAgICAgICAqIElmIHRoZSBrZXlzIGFyZSBhbiBhcnJheSBmaW5kIGVhY2hcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBtYXAoKSB7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGtleXMsIGtleXMgaW5zdGFuY2VvZiBBcnJheSlcclxuICAgICAgICAgICAgaWYgKGtleXMgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJrZXlzXCIsa2V5c1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzaW9uKHZtW2F0dHJzLmF1dG9GaWxsVm1TcmNdLCBrZXlzW2ldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHJlY3Vyc2lvbih2bVthdHRycy5hdXRvRmlsbFZtU3JjXSwga2V5cyk7XHJcblxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgKiBSZWN1cnNpb24gZnVuY3Rpb25cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlY3Vyc2lvbihhcnIsIHByb3ApIHtcclxuICAgICAgICAgICAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBBcnJheSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJyW2ldIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2xheWVycy5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaW9uKGFycltpXSwgcHJvcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYXJyW2ldW3Byb3BdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2xheWVycy5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0QXJyLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6YXJyW2ldW3Byb3BdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOmFycltpXS5faWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJrZXkgZm91bmRcIiwgdGFyZ2V0QXJyW2ldLGFycltpXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhcnIgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gYXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IHByb3ApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRBcnIucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTphcnJbcHJvcF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6YXJyLl9pZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwia2V5IGZvdW5kXCIsIGtleSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJyW2tleV0gaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYXllcnMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaW9uKGFycltrZXldLCBwcm9wKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3VzZXIgYWN0aXZhdGVkIHNlYXJjaFxyXG4gICAgICAgIC8vc2VhcmNoTW9kZWwgbm93IGhhcyBuZXcgdmFsXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHNlYXJjaEJ5TW9kZWwoKSB7XHJcbiAgICAgICAgICAgIGlmICghc2NvcGUuc2VhcmNoTW9kZWwubGVuZ3RoKXtcclxuICAgICAgICAgICAgICAgIHNjb3BlLm91dHB1dHNBY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzY29wZS5vdXRwdXRzID0gW107XHJcblxyXG4gICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVsZW1lbnQuZmluZChcImRpdlwiKSlcclxuICAgICAgICAgICAgZmluZFRhcmdldCgpO1xyXG4gICAgICAgICAgICBmb3JtYXRUYXJnZXQoKTtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZmluZFRhcmdldCgpIHtcclxuICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8dGFyZ2V0QXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGZpbmRTaW1wbGUodGFyZ2V0QXJyW2ldKT4tMSkgc2NvcGUub3V0cHV0cy5wdXNoKHRhcmdldEFycltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoc2NvcGUub3V0cHV0cy5sZW5ndGggPj0xMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmdW5jdGlvbiBmb3JtYXRUYXJnZXQoKXtcclxuICAgICAgICAgICAgICAgIHRhcmdldEFyci5zb3J0KGZ1bmN0aW9uKGEsYil7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbmRTaW1wbGUoYSkgLSBmaW5kU2ltcGxlKGIpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmdW5jdGlvbiBmaW5kU2ltcGxlKGEpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc2NvcGUuc2VhcmNoTW9kZWwudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cdH1cclxufSIsIi8qKlxyXG4qIERhdGEgRmFjdG9yeVxyXG4qIEBkZXNjIGNvbW11bmljYXRlcyB3aXRoIHRoZSBhcGksIHJldHVybnMgcHJvbWlzZXMgb2YgZGF0YVxyXG4qL1xyXG5cclxuYW5ndWxhci5tb2R1bGUoQVBQTkFNRSkuZmFjdG9yeShcImRhdGFGYWN0XCIsZGF0YUZhY3QpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGRhdGFGYWN0KGh0dHBGYWN0LCAkcSwgJHRpbWVvdXQpe1xyXG5cclxuICAgIC8vdGhpc1xyXG5cdGxldCBkYXRhRiA9IHt9O1xyXG5cclxuICAgIC8vZGF0YSB3ZSdyZSBzZXJ2aW5nXHJcbiAgICBkYXRhRi5jYW1wdXNlcyA9IFtdO1xyXG4gICAgZGF0YUYud2Vla3MgPSBbXTtcclxuXHJcbiAgICAvL3VzZWQgdG8gcGFyc2UgdGhlIHdlZWsgbnVtXHJcbiAgICBsZXQgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcblxyXG4gICAgLy9jaGVjayB0aGVzZSBpbiBnZXR0ZXJzXHJcbiAgICAvL2lmIGRhdGEgbm90IHlldCBsb2FkZWQgZnJvbSBBUEkgKCk9PiB0aGF0J3MgYSBwYWRkbGluJ1xyXG4gICAgbGV0IHByb21pc2VzID17XHJcbiAgICAgICAgY2FtcHVzZXMgOiBmYWxzZSxcclxuICAgICAgICBjbGFzc2VzIDogZmFsc2UsXHJcbiAgICAgICAgd2Vla3M6ZmFsc2VcclxuICAgIH07XHJcblxyXG4gICAgLy9QdWJsaWMgZnVuY3Rpb25zXHJcblxyXG4gICAgLypcclxuICAgICAqIEdldCBjYW1wdXNlcyBkYXRhIGZyb20gQVBJXHJcbiAgICAgKi9cclxuICAgIGRhdGFGLmluaXQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRGF0YSBmYWN0b3J5IGluaXRpYWxpemVkLCBnZXR0aW5nIGRhdGFcIilcclxuICAgICAgICBodHRwRmFjdC5nZXQoXCIvY2FtcHVzXCIpLnRoZW4oKGQpPT57XHJcbiAgICAgICAgICAgIGRhdGFGLmNhbXB1c2VzID0gZC5kYXRhO1xyXG4gICAgICAgICAgICBwcm9taXNlcy5jYW1wdXNlcyA9IHRydWU7XHJcbiAgICAgICAgICAgIGRhdGFGLmluaXRDbGFzc2VzKCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goKGVycik9PntcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZXJyQGRhdGFmYWN0IGNhbXB1c1wiLGVycik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qXHJcbiAgICAqIEdldCBjbGFzc2VzIGRhdGEgZnJvbSBBUElcclxuICAgICAqL1xyXG4gICAgZGF0YUYuaW5pdENsYXNzZXMgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAvL0FzeW5jIHN0ZXAgZnVuY1xyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAoaSkge1xyXG4gICAgICAgICAgICBodHRwRmFjdC5nZXQoXCIvY2FtcHVzL1wiICsgZW5jb2RlVVJJKGRhdGFGLmNhbXB1c2VzW2ldLm5hbWUpICsgXCIvY2xhc3Nlc1wiKS50aGVuKChkKT0+IHtcclxuICAgICAgICAgICAgICAgIHBhcnNlQ2FtcHVzZXMoZC5kYXRhLCBcImNsYXNzZXNcIik7XHJcbiAgICAgICAgICAgICAgICBpZihpPGRhdGFGLmNhbXB1c2VzLmxlbmd0aC0xKSBzdGVwKGkrPTEpO1xyXG4gICAgICAgICAgICAgICAgZWxzZXsgICAvL0NsYXNzZXMgZG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY2xhc3NlcyBkb25lXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VzLmNsYXNzZXMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFGLmluaXRXZWVrcygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RlcCgwKTtcclxuICAgIH07XHJcblxyXG4gICAgLypcclxuICAgICAqIEdldCB3ZWVrcyBkYXRhIGZyb20gQVBJXHJcbiAgICAgKi9cclxuICAgIGRhdGFGLmluaXRXZWVrcyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIC8vQXN5bmMgc3RlcCBmdW5jXHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChpKSB7XHJcbiAgICAgICAgICAgIGh0dHBGYWN0LmdldChcIi9jYW1wdXMvXCIgKyBlbmNvZGVVUkkoZGF0YUYuY2FtcHVzZXNbaV0ubmFtZSkgKyBcIi93ZWVrc1wiKS50aGVuKChkKT0+IHtcclxuICAgICAgICAgICAgICAgIGRhdGFGLndlZWtzLnB1c2goZC5kYXRhKTtcclxuICAgICAgICAgICAgICAgIGlmKGk8ZGF0YUYuY2FtcHVzZXMubGVuZ3RoLTEpIHN0ZXAoaSs9MSk7XHJcbiAgICAgICAgICAgICAgICBlbHNleyAvL3dlZWtzIGRvbmVcclxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy53ZWVrcyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ3ZWVrcyBkb25lXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RlcCgwKTtcclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgIEdldHRlcnNcclxuICAgICAqL1xyXG5cclxuICAgICAvKipcclxuICAgICAqIFBhcnNlIGEgd2VlaydzIGRhdGEgYmFzZWQgb24gc2VsZWN0ZWQgZGF0ZSAmIGNsYXNzIG5hbWVcclxuICAgICAqIEBwYXJhbSBzZWFjaE1vZGVsIG9iaiAtIC53ZWVrTnVtYmVyOiAubmFtZTogXHJcbiAgICAgKi9cclxuICAgIGRhdGFGLmdldFdlZWtEYXRhID0gZnVuY3Rpb24oc2VhY2hNb2RlbCl7XHJcblxyXG4gICAgICAgIGxldCB3ID0gbmV3IERhdGUoZGF0ZSkuZ2V0V2VlaygpO1xyXG5cclxuICAgICAgICAvL1dlZWtzID0gYWxsIGNhbXB1c2VzIGFsbCB3ZWVrc1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTxkYXRhRi53ZWVrcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgLy9XZWVrc1tpXSA9IGFsbCB3ZWVrcyBmcm9tIDEgY2FtcHVzXHJcbiAgICAgICAgICAgIGZvcihsZXQgaiA9IDA7ajxkYXRhRi53ZWVrc1tpXS5sZW5ndGg7aisrKXsgXHJcbiAgICAgICAgICAgICAgICAvL1dlZWtzW2ldW2pdID0gZGF0YSBmcm9tIDEgd2Vla3MgZnJvbSAxIGNhbXB1c1xyXG4gICAgICAgICAgICAgICAgLy9IYXMgY2xhc3M6YXNkYXNkICwgd2Vla051bWJlcjo0OVxyXG4gICAgICAgICAgICAgICAgaWYoZGF0YUYud2Vla3NbaV1bal0uY2xhc3M9PT1zZWFjaE1vZGVsLmNsYXNzJiZkYXRhRi53ZWVrc1tpXVtqXS53ZWVrTnVtYmVyPT09dyl7XHJcbiAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWF0Y2ghXCIsZGF0YUYud2Vla3NbaV1bal0sdyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YUYud2Vla3NbaV1bal0ubmFtZSA9IHNlYWNoTW9kZWwubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhRi53ZWVrc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFGLndlZWtzW2ldW2pdO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qXHJcbiAgICAqIENhbXB1cyB8IENsYXNzIHwgV2Vla1xyXG4gICAgKiBJZiBkYXRhIG5vdCB5ZXQgbG9hZGVkIHJlc29sdmUsIHdhaXQgYSBzZWMsIGlmIHN0aWxsIG5vdCByZWplY3RcclxuICAgICAqL1xyXG4gICAgZGF0YUYuZ2V0Q2FtcHVzID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUsIHJlamVjdCk9PntcclxuICAgICAgICAgICAgY2hlY2tGb3JTdGF0dXNSZXR1cm5Qcm9taXNlKFwiY2FtcHVzZXNcIixcImNhbXB1c2VzXCIsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgZGF0YUYuZ2V0Q2FtcHVzRGF0YSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuICRxKChyZXNvbHZlLCByZWplY3QpPT57XHJcbiAgICAgICAgICAgIGNoZWNrRm9yU3RhdHVzUmV0dXJuUHJvbWlzZShcImNsYXNzZXNcIixcImNhbXB1c2VzXCIsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgZGF0YUYuZ2V0Q2FtcHVzV2Vla3MgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiAkcSgocmVzb2x2ZSwgcmVqZWN0KT0+e1xyXG4gICAgICAgICAgICBjaGVja0ZvclN0YXR1c1JldHVyblByb21pc2UoXCJ3ZWVrc1wiLFwid2Vla3NcIiwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gYSB3ZWVrIHNjaGVkdWxlXHJcbiAgICAgKiBOb3RlIHRoYXQgd2UgY2FudCByZXR1cm4gc29tZXRoaW5nIHdlIGRvbid0IGhhdmUgLT4gbWFrZSBzdXJlIHdlIGhhdmUgdGhlIGRhdGEgZmlyc3QsIHRoZW4gcGFyc2VcclxuICAgICAqIEBwYXJhbSBjdXJyZW50QnlTdGF0ZSAtIG9iajogd2VlayBudW1iZXIsIGNsYXNzIG5hbWUgT1BUSU9OQUwgY2xhc3MgaWRcclxuICAgICAqIEByZXR1cm4gcHJvbWlzZSBvZiBkYXRhXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICBkYXRhRi5nZXRTY2hlZHVsZSA9IGZ1bmN0aW9uKGN1cnJlbnRCeVN0YXRlKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUsIHJlamVjdCk9PntcclxuXHJcbiAgICAgICAgICAgIGxldCByZXR1cm5WYWw7XHJcbiAgICAgICAgICAgIGlmKHByb21pc2VzLndlZWtzKSBtYWluTG9vcCgpO1xyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoKCk9PntcclxuICAgICAgICAgICAgICAgICAgICBpZihwcm9taXNlcy53ZWVrcykgbWFpbkxvb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHJlamVjdChcIkFQSSB1bmF2YWlsYWJsZSBhdCB0aGlzIHRpbWUsIHNvIHNvcnJ5XCIpXHJcbiAgICAgICAgICAgICAgICB9LDUwMDApXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIG1haW5Mb29wKCl7XHJcbiAgICAgICAgICAgICAgICBpZighY3VycmVudEJ5U3RhdGUuY2xhc3NJZCkgZ2V0Q2xhc3NEYXRhKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjdXJyZW50QnlTdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGdldFdlZWtEYXRhU2NoZWR1bGUoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vcHJpdmF0ZSBtYXBwaW5nIGZ1bmN0aW9uLCBmaW5kIGNsYXNzIGlkIGJ5IG5hbWVcclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0Q2xhc3NEYXRhKCl7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8IGRhdGFGLmNhbXB1c2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaiA9IDA7ajxkYXRhRi5jYW1wdXNlc1tpXS5jbGFzc2VzLmxlbmd0aDtqKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YUYuY2FtcHVzZXNbaV0uY2xhc3Nlc1tqXS5uYW1lID09PSBjdXJyZW50QnlTdGF0ZS5uYW1lKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRCeVN0YXRlLmNsYXNzSWQgPSBkYXRhRi5jYW1wdXNlc1tpXS5jbGFzc2VzW2pdLl9pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0V2Vla0RhdGFTY2hlZHVsZSgpe1xyXG4gICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhRi53ZWVrcyk7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZGF0YUYud2Vla3MubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGRhdGFGLndlZWtzW2ldLmxlbmd0aDtqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFGLndlZWtzW2ldW2pdLmNsYXNzID09PSBjdXJyZW50QnlTdGF0ZS5jbGFzc0lkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhRi53ZWVrc1tpXVtqXS5uYW1lID0gY3VycmVudEJ5U3RhdGUubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhRi53ZWVrc1tpXVtqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL1ByaXZhdGVcclxuICAgIC8qXHJcbiAgICAqIElmIGRhdGEgbm90IHlldCBsb2FkZWQgcmVzb2x2ZSwgd2FpdCBhIHNlYywgaWYgc3RpbGwgbm90IHJlamVjdFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclN0YXR1c1JldHVyblByb21pc2UocCwgZGF0YSwgcmVzb2x2ZSwgcmVqZWN0KXtcclxuICAgICAgICBpZihwcm9taXNlc1twXSkgcmVzb2x2ZShkYXRhRltkYXRhXSk7XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgJHRpbWVvdXQoKCk9PnsgIC8vIGNvbnNvbGUubG9nKGNhbXB1c2VzKTtcclxuICAgICAgICAgICAgICAgIGlmKHByb21pc2VzW3BdKSByZXNvbHZlKGRhdGFGW2RhdGFdKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgcmVqZWN0KFwiQVBJIHVuYXZhaWxhYmxlIGF0IHRoaXMgdGltZSwgc28gc29ycnlcIilcclxuICAgICAgICAgICAgfSw1MDAwKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgKiBBc3NpZ24gYSBjYW1wdXMgaXQncyBjbGFzc2VzXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlQ2FtcHVzZXMoZGF0YSwgayl7XHJcbiAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICBmb3IobGV0IGogPSAwO2o8ZGF0YUYuY2FtcHVzZXMubGVuZ3RoO2orKyl7IFxyXG4gICAgICAgICAgICBpZihkYXRhRi5jYW1wdXNlc1tqXS5faWQgPT09IGRhdGFbMF0uY2FtcHVzKXtcclxuICAgICAgICAgICAgICAgIGRhdGFGLmNhbXB1c2VzW2pdW2tdID0gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkYXRhRi5pbml0KCk7IC8vc2luZ2xldG9ucyA8M1xyXG5cdHJldHVybiBkYXRhRjtcclxufVxyXG5cclxuXHJcbi8vZGF0YUZhY3QuJGluamVjdCA9IFtcImh0dHBGYWN0LCAkcSwgJHRpbWVvdXRcIl07XHJcbiAgIiwiLypcclxuKiBGaW5kIENvbnRyb2xsZXJcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmNvbnRyb2xsZXIoXCJmaW5kQ3RybFwiLGZpbmRDdHJsKTtcclxuXHJcbi8vc2ZpbmRDdHJsLiRpbmplY3QgPSBbXCJkYXRhRmFjdCxzY2hlZHVsZUZhY3QsICRzdGF0ZVwiXTtcclxuXHJcbmZ1bmN0aW9uIGZpbmRDdHJsKGRhdGFGYWN0LHNjaGVkdWxlRmFjdCwgJHN0YXRlKXtcclxuXHJcbiAgICAvL3RoaXNcclxuICAgIGxldCB2bSA9IHRoaXM7XHJcblxyXG4gICAgLy9JTklUXHJcbiAgICAvL2dldCBjYW1wdXMgJiBjbGFzc2VzIGRhdGFcclxuICAgIChmdW5jdGlvbigpe1xyXG4gICAgICAgIGRhdGFGYWN0LmdldENhbXB1c0RhdGEoKS50aGVuKChkYXRhKT0+e1xyXG4gICAgICAgICAgICB2bS5jYW1wdXNlcyA9IGRhdGE7XHJcblxyXG4gICAgICAgIH0pLmNhdGNoKChlcnIpPT57XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0pKCk7XHJcblxyXG4gICAgLy9FdmVudCBsaXN0ZW5lcnNcclxuICAgIC8vVEhFIEZJTkQgQUNUSU9OXHJcbiAgICB2bS5maW5kU2NoZWR1bGUgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyh2bS5zZWFjaE1vZGVsKTtcclxuICAgICAgICAvL0ZpbmQgd2VlayBhbmQgc2V0IGFzIGFjdGl2ZVxyXG4gICAgICAgIGxldCB3ID0gZGF0YUZhY3QuZ2V0V2Vla0RhdGEodm0uc2VhY2hNb2RlbCk7XHJcbiAgICAgICAgY29uc29sZS5sb2codyk7XHJcbiAgICAgICAgc2NoZWR1bGVGYWN0LnNldFNjaGVkdWxlKHcpO1xyXG4gICAgICAgIC8vZ290b1xyXG4gICAgICAgICRzdGF0ZS5nbyhcInNjaGVkdWxlLmNsYXNzLndlZWtcIiwge1xyXG4gICAgICAgICAgICBjTmFtZTplbmNvZGVVUkkody5uYW1lKSxcclxuICAgICAgICAgICAgd246ZW5jb2RlVVJJKHcud2Vla051bWJlcilcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG59XHJcblxyXG5cclxuIiwiLyoqXHJcbiogSHR0cCBmYWN0b3J5XHJcbiogQGRlc2MgY29tbXVuaWNhdGVzIHdpdGggdGhlIEFQSVxyXG4qL1xyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FKS5mYWN0b3J5KFwiaHR0cEZhY3RcIixodHRwRmFjdCk7XHJcblxyXG5odHRwRmFjdC4kaW5qZWN0ID0gW1wiJGh0dHBcIl07XHJcblxyXG5mdW5jdGlvbiBodHRwRmFjdCgkaHR0cCl7XHJcblxyXG4gICAgbGV0IGh0dHBGID0ge307XHJcblxyXG4gICAgbGV0IGFwaUFkZHIgPSBcIi9hcGlcIjtcclxuXHJcbiAgICAvL3B1YmxpY1xyXG4gICAgLypcclxuICAgICogQSBzaW1wbGUgZ2V0IGZ1bmN0aW9uXHJcbiAgICAqIEBwYXJhbSByb3V0ZSBTdHJpbmdcclxuICAgICAqL1xyXG4gICAgaHR0cEYuZ2V0ID0gZnVuY3Rpb24ocm91dGUpe1xyXG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoYXBpQWRkcityb3V0ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBodHRwRjtcclxufVxyXG5cclxuXHJcbiAiLCIvKlxyXG4qICAgU2NoZWR1bGVzIENvbnRyb2xsZXJcclxuKi9cclxuXHJcbi8qKlxyXG4qIFRPRE9cclxuKiAgIFNldCB0aGUgaGVpZ2h0IG9mIHRoZSBjb2x1bXMgYmFzZWQgb24gZHVyYXRpb25cclxuKiAgIEFsc28gdGhpcyBpcyByZXF1aXJlZCBmb3IgdGhlIHRleHRcclxuKiAgIFNlZW1zIGxpa2Ugd2UgY2FudCB1c2UgdGhlIG5nLW1hdGVyaWFsIGdyaWQsIHRoZXNlIGNvbHVtbnMgbmVlZCB0byBmbG93XHJcbiogICBcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmNvbnRyb2xsZXIoXCJzY2hlZHVsZUN0cmxcIixzY2hlZHVsZUN0cmwpO1xyXG5cclxuc2NoZWR1bGVDdHJsLiRpbmplY3QgPSBbXCJzY2hlZHVsZUZhY3RcIl07XHJcblxyXG5mdW5jdGlvbiBzY2hlZHVsZUN0cmwoc2NoZWR1bGVGYWN0KXtcclxuXHJcbiAgICAvL3RoaXNcclxuICAgIGxldCB2bSA9IHRoaXM7XHJcblxyXG4gICAgdm0uZGF5TnVtID0gODtcclxuXHJcbiAgICAvL2dldCB0aGlzIHNjaGVkdWxlIGZyb20gZmFjdFxyXG4gICAgc2NoZWR1bGVGYWN0LmdldFNjaGVkdWxlKCkudGhlbigoZGF0YSk9PntcclxuICAgICAgICBkYXRhLnNjaGVkdWxlID0gcGFyc2VTY2hlZHVsZXMoZGF0YS5zY2hlZHVsZSk7XHJcbiAgICAgICAgdm0uc2NoZWR1bGVJdGVtID1kYXRhO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHZtLnNjaGVkdWxlSXRlbSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvL3BhcnNlIHNjaGVkdWxlIGFyciB0byBtb2FyIHN1aXRhYmxlIGZvcm1cclxuICAgIGZ1bmN0aW9uIHBhcnNlU2NoZWR1bGVzKGQpe1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTxkLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZFtpXS5zbG90cy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICBkW2ldLnNsb3RzW2pdLnRleHQgPSBkW2ldLnNsb3RzW2pdLnRleHQucmVwbGFjZSgvXFxzKkBickBcXHMqL2dpLFwiQFwiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuIiwiLyoqXHJcbiAqIFNjaGVkdWxlIGZhY3RvcnlcclxuICogQGRlc2Mgc3RvcmUgc2NoZWR1bGUgZGF0YSwgZ2V0IG9uZSBpZiBub3QgZXhpdHNcclxuICovXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmZhY3RvcnkoXCJzY2hlZHVsZUZhY3RcIixzY2hlZHVsZUZhY3QpO1xyXG5cclxuLy9zY2hlZHVsZUZhY3QuJGluamVjdCA9IFtcIiRzdGF0ZVBhcmFtcywgZGF0YUZhY3QsICRxXCJdO1xyXG5cclxuZnVuY3Rpb24gc2NoZWR1bGVGYWN0KCRzdGF0ZVBhcmFtcywgZGF0YUZhY3QsICRxKXtcclxuXHJcbiAgICAvL3RoaXNcclxuXHRsZXQgc2NoZWR1bGUgPSB7fTtcclxuXHJcbiAgICAvL3RoZSBvbmUgd2UncmUgc2VydmluZyB0byB0aGUgY29udHJvbGxlclxyXG4gICAgbGV0IGFjdGl2ZVNjaGVkdWxlID17XHJcbiAgICAgICAgd2Vla051bWJlcjogbnVsbCxcclxuICAgICAgICBuYW1lOiBudWxsXHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBjdXJyZW50QnlTdGF0ZSA9IHt9O1xyXG5cclxuICAgIC8vYXJlIHdlIHN1cmUgdGhhdCB0aGUgc2NoZWR1bGUgaXMgdGhlIHJpZ2h0IG9uZT9cclxuICAgIGxldCBjb21wbGV0ZTtcclxuXHJcbiAgICAvL1ByaXZhdGUgZnVuY3Rpb25zXHJcblxyXG4gICAgLyoqXHJcbiAgICAqIFBhcnNlIHN0YXRlIHBhcmFtcyAtIGRvIHRoZXkgbWF0Y2ggdGhlIHNjaGVkdWxlIHdlIGhhdmU/XHJcbiAgICAqIElmICFtYXRjaCB8fCB3ZSBkb24ndCBoYXZlIGEgc2NoZWR1bGVcclxuICAgICogICBHZXQgdGhlIGNvcnJlY3Qgb25lIGZvciBkYXRhZmFjdCBhY2NvcmRpbmcgdG8gc3RhdGVwYXJhbXNcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcGFyc2VTdGF0ZSgpIHtcclxuICAgICAgICBjdXJyZW50QnlTdGF0ZS53ZWVrTnVtYmVyID0gJHN0YXRlUGFyYW1zLnduO1xyXG4gICAgICAgIGN1cnJlbnRCeVN0YXRlLm5hbWUgPSAkc3RhdGVQYXJhbXMuY05hbWU7XHJcbiAgICAgICAgaWYoY3VycmVudEJ5U3RhdGUud2Vla051bWJlcj09PWFjdGl2ZVNjaGVkdWxlLndlZWtOdW1iZXImJmN1cnJlbnRCeVN0YXRlLm5hbWU9PT1hY3RpdmVTY2hlZHVsZS5uYW1lKSBjb21wbGV0ZSA9IHRydWU7XHJcbi8qICAgICAgICBlbHNlIGRhdGFGYWN0LmdldFNjaGVkdWxlKGN1cnJlbnRCeVN0YXRlKS50aGVuKChkYXRhKT0+e1xyXG5cclxuICAgICAgICB9KTsqL1xyXG4gICAgfVxyXG5cclxuICAgIC8vUHVibGljIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8vU2V0dGVycyAmIEdldHRlcnNcclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBvYmpcclxuICAgICAqL1xyXG4gICAgc2NoZWR1bGUuc2V0U2NoZWR1bGUgPSBmdW5jdGlvbihvYmope1xyXG4gICAgICAgIGFjdGl2ZVNjaGVkdWxlID0gb2JqO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqQGRlc2MgR2V0IHRoZSBzY2hlZHVsZSB3ZSdyZSB1c2luZ1xyXG4gICAgICogQHJldHVybiBwcm9taXNlLCB0aGVuIHRoZSBkYXRhXHJcbiAgICAgKiAgaWYgd2UgZG9uJ3QgaGF2ZSBpdCB3ZSdsbCBoYXZlIHRvIHBhcnNlIGl0IGZyb20gc3RhdGVwYXJhbXNcclxuICAgICAqICAgICAgYW5kIHRoZSBnZXQgaWYgZnJvbSB0aGUgZGF0YSBmYWNvdHJ5XHJcbiAgICAgKi9cclxuICAgIHNjaGVkdWxlLmdldFNjaGVkdWxlID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUscmVqZWN0KT0+e1xyXG5cclxuICAgICAgICAgICAgcGFyc2VTdGF0ZSgpO1xyXG4gICAgICAgICAgICBpZihjb21wbGV0ZSkgcmVzb2x2ZShhY3RpdmVTY2hlZHVsZSk7XHJcblxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgZGF0YUZhY3QuZ2V0U2NoZWR1bGUoY3VycmVudEJ5U3RhdGUpLnRoZW4oKHNjaCk9PntcclxuICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZS5zZXRTY2hlZHVsZShzY2gpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYWN0aXZlU2NoZWR1bGUpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyKT0+e1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZXJyKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfTtcclxuXHJcblxyXG5cdHJldHVybiBzY2hlZHVsZTtcclxufVxyXG5cclxuXHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
