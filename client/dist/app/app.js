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
"use strict";

/*
*	UI Routes
*/
angular.module("lukkari").config(states, "states");
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

/*
//RUN
angular.module("lukkari").run(init,"init");
function init(dataFact){
	dataFact.init();
}*/
"use strict";

/*
* @juhohey 26.11.2015 - angular 1.4
* Auto fill
* @desc *Auto fills searches*
* @param: auto-fill-vm: vm to target
* @param: auto-fill-src: a property of vm to search
* @param: auto-fill-keys: keys to search in src | string or array
* @param: auto-fill-cb: function to execute on user action, passed the key and it's path found
*/

angular.module(APPNAME).directive("autoFill", autoFill);

//autoFill.$inject = [""]

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
        /*
        else scope.outputs ={};
        }*/
        /*
        function searchByModel () {
            if (scope.searchModel.length>0) {
                if (!scope.outputs) {scope.outputs = {}};
                searchObj(false,["personal"]);
                searchObj(true,scope.keys);
            }
            else scope.outputs ={};
        }
        function searchObj (inner, props) {
            searchThis = inner ? scope.main.sections : scope.main;
            for (var i = 0; i < props.length; i++) {
                for(var k in searchThis[props[i]].content){
                    if(searchThis[props[i]].content[k].value){
                        if (checkThis(searchThis[props[i]].content[k],"value")||checkThis(searchThis[props[i]].content[k],"label")) {
                            //console.log("MATCH",scope.main[props[i]].content[k]);
                              scope.outputs[k] = searchThis[props[i]].content[k];
                        }
                        else{
                            if (scope.outputs[k]) delete scope.outputs[k];
                        }
                    };
                };
            };
        };
        function checkThis (obj,prop) {
            return obj[prop].toLowerCase().indexOf(scope.searchModel.toLowerCase())>-1;
        }*/
    }
}
"use strict";

/**
* Data Factory
* @desc communicates with the api, returns promises of data
*/

angular.module(APPNAME).factory("dataFact", dataFact);

//dataFact.$inject = [""]

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

/**
 * Created by admin on 26.11.2015.
 */
/*
* ng-controller
*/

angular.module("lukkari").controller("findCtrl", findCtrl);

//findCtrl.$inject = [""]

function findCtrl(dataFact, scheduleFact, $state) {

    //this
    var vm = this;

    //INIT
    (function () {
        dataFact.init();
        dataFact.getCampusData().then(function (data) {
            vm.campuses = data;

            /* dataFact.getCampusWeeks().then((data)=>{
                 vm.weeks = data;
               }).catch((err)=>{
                 console.error(err)
             })*/
        }).catch(function (err) {
            console.error(err);
        });
    })();

    vm.selectCampusOrClass = function (classOrCampus) {
        console.log(classOrCampus);
    };

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

    //Private

    /*
    * Parse correct when class & date known
    * @return week object
     */
}
"use strict";

/**
 * Created by admin on 26.11.2015.
 */
/*
* ng-factory
*/
angular.module("lukkari").factory("httpFact", httpFact);

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

/**
 * Created by admin on 28.11.2015.
 */
/*
*   Schedules
*/

angular.module(APPNAME).controller("scheduleCtrl", scheduleCtrl);

//scheduleCtrl.$inject = [""]

function scheduleCtrl(scheduleFact) {

    //this
    var vm = this;

    vm.hello = "hello";
    console.log(vm.hello);
    scheduleFact.getSchedule().then(function (data) {
        data.schedule = parseSchedules(data.schedule);
        vm.scheduleItem = data;
        console.log(vm.scheduleItem);
    });
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
 * Created by admin on 28.11.2015.
 */
/**
 * Schedule factory
 * @desc store schedule data, get one if not exits
 */
angular.module(APPNAME).factory("scheduleFact", scheduleFact);

//scheduleFact.$inject = [""]

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbmZpZy5qcyIsImF1dG9GaWxsLmpzIiwiZGF0YUZhY3QuanMiLCJmaW5kQ3RybC5qcyIsImh0dHBGYWN0LmpzIiwic2NoZWR1bGVDdHJsLmpzIiwic2NoZWR1bGVGYWN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUlBLElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQzs7QUFFeEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUMsWUFBWSxDQUFDLENBQUM7Ozs7O0FBQUMsQUFLcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsWUFBVztBQUNoQyxRQUFJLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hELFdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEFBQUMsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFBLEdBQUksUUFBUSxHQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUEsR0FBSSxDQUFDLENBQUMsQ0FBQztDQUM5RSxDQUFDOzs7Ozs7QUNYRixPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUMsUUFBUSxDQUFDLENBQUM7QUFDbEQsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLGdCQUFnQixFQUFFLG9CQUFvQixDQUFDLENBQUM7O0FBRTFELFNBQVMsTUFBTSxDQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBQztBQUNuRCxhQUFZLENBQUM7O0FBQ2IsbUJBQWtCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3JDLEtBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLGVBQWMsQ0FDYixLQUFLLENBQUMsTUFBTSxFQUFDO0FBQ1osS0FBRyxFQUFDLE9BQU87QUFDWCxhQUFXLEVBQUUscUJBQXFCO0VB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QTtpQkFDZixDQUFDLENBQUE7YUFDTDtTQUNKLENBQUMsQ0FBQTtLQUVMLENBQUM7O0FBR0wsV0FBTyxRQUFRLENBQUM7Q0FDaEIiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiogQW5ndWxhciBtb2R1bGVcbiovXG5cbnZhciBBUFBOQU1FID0gXCJsdWtrYXJpXCI7XG5cbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUsIFsndWkucm91dGVyJywnbmdNYXRlcmlhbCddKTtcblxuLypcbiogVXRpbGl0eVxuICovXG5EYXRlLnByb3RvdHlwZS5nZXRXZWVrID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IG9uZWphbiA9IG5ldyBEYXRlKHRoaXMuZ2V0RnVsbFllYXIoKSwgMCwgMSk7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgoKCh0aGlzIC0gb25lamFuKSAvIDg2NDAwMDAwKSArIG9uZWphbi5nZXREYXkoKSArIDEpIC8gNyk7XG59OyIsIi8qXHJcbipcdFVJIFJvdXRlc1xyXG4qL1xyXG5hbmd1bGFyLm1vZHVsZShcImx1a2thcmlcIikuY29uZmlnKHN0YXRlcyxcInN0YXRlc1wiKTtcclxuc3RhdGVzLiRpbmplY3QgPSBbJyRzdGF0ZVByb3ZpZGVyJywgJyR1cmxSb3V0ZXJQcm92aWRlciddO1xyXG5cclxuZnVuY3Rpb24gc3RhdGVzICgkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKXtcclxuXHRcInVzZSBzdHJpY3RcIjtcclxuXHQkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwiZmluZFwiKTtcclxuXHR2YXIgcm91dGUgPSBcIlwiO1xyXG5cdCRzdGF0ZVByb3ZpZGVyXHJcblx0LnN0YXRlKFwiZmluZFwiLHtcclxuXHQgXHR1cmw6XCIvZmluZFwiLFxyXG5cdCBcdHRlbXBsYXRlVXJsOiBcIi9hcHAvZmluZC9maW5kLmh0bWxcIlxyXG5cdH0pIFxyXG5cdC5zdGF0ZShcInNjaGVkdWxlXCIse1xyXG5cdCBcdHVybDpyb3V0ZStcIi9zY2hlZHVsZVwiLFxyXG5cdCBcdHRlbXBsYXRlVXJsOiBcIi9hcHAvc2NoZWR1bGUvc2NoZWR1bGUuaHRtbFwiXHJcblx0fSlcclxuXHRcdC5zdGF0ZShcInNjaGVkdWxlLmNhbXB1c1wiLHtcclxuXHRcdFx0dXJsOnJvdXRlK1wiLzpjYW1wdXNcIixcclxuXHRcdFx0dGVtcGxhdGVVcmw6IFwiL2FwcC9zY2hlZHVsZS9zY2hlZHVsZS5odG1sXCJcclxuXHRcdH0pXHJcblx0XHRcdC5zdGF0ZShcInNjaGVkdWxlLmNsYXNzXCIse1xyXG5cdFx0XHRcdHVybDpyb3V0ZStcIi86Y05hbWVcIixcclxuXHRcdFx0XHR0ZW1wbGF0ZVVybDogXCIvYXBwL3NjaGVkdWxlL3NjaGVkdWxlLmh0bWxcIlxyXG5cdFx0XHR9KVxyXG5cdFx0XHRcdC5zdGF0ZShcInNjaGVkdWxlLmNsYXNzLndlZWtcIix7XHJcblx0XHRcdFx0XHR1cmw6cm91dGUrXCIvOnduXCIsXHJcblx0XHRcdFx0XHR0ZW1wbGF0ZVVybDpcIi9hcHAvc2NoZWR1bGUvc2NoZWR1bGUuaHRtbFwiXHJcblx0XHRcdFx0fSlcclxuXHJcbn1cclxuXHJcbi8qXHJcbi8vUlVOXHJcbmFuZ3VsYXIubW9kdWxlKFwibHVra2FyaVwiKS5ydW4oaW5pdCxcImluaXRcIik7XHJcbmZ1bmN0aW9uIGluaXQoZGF0YUZhY3Qpe1xyXG5cdGRhdGFGYWN0LmluaXQoKTtcclxufSovXHJcbiIsIlxyXG4vKlxyXG4qIEBqdWhvaGV5IDI2LjExLjIwMTUgLSBhbmd1bGFyIDEuNFxyXG4qIEF1dG8gZmlsbFxyXG4qIEBkZXNjICpBdXRvIGZpbGxzIHNlYXJjaGVzKlxyXG4qIEBwYXJhbTogYXV0by1maWxsLXZtOiB2bSB0byB0YXJnZXRcclxuKiBAcGFyYW06IGF1dG8tZmlsbC1zcmM6IGEgcHJvcGVydHkgb2Ygdm0gdG8gc2VhcmNoXHJcbiogQHBhcmFtOiBhdXRvLWZpbGwta2V5czoga2V5cyB0byBzZWFyY2ggaW4gc3JjIHwgc3RyaW5nIG9yIGFycmF5XHJcbiogQHBhcmFtOiBhdXRvLWZpbGwtY2I6IGZ1bmN0aW9uIHRvIGV4ZWN1dGUgb24gdXNlciBhY3Rpb24sIHBhc3NlZCB0aGUga2V5IGFuZCBpdCdzIHBhdGggZm91bmRcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmRpcmVjdGl2ZShcImF1dG9GaWxsXCIsYXV0b0ZpbGwpO1xyXG5cclxuLy9hdXRvRmlsbC4kaW5qZWN0ID0gW1wiXCJdXHJcblxyXG5mdW5jdGlvbiBhdXRvRmlsbCgkY29tcGlsZSl7XHJcblx0cmV0dXJue1xyXG5cdFx0c2NvcGU6XCI9XCIsXHJcblx0XHRsaW5rOmxpbmtGdW5jLFxyXG5cdFx0dGVtcGxhdGU6XCJcIixcclxuXHRcdHJlc3RyaWN0OlwiRVwiXHJcblx0fTtcclxuXHRmdW5jdGlvbiBsaW5rRnVuYyhzY29wZSxlbGVtZW50LGF0dHJzKSB7XHJcblxyXG4gICAgICAgIGxldCB2bSA9IHNjb3BlW2F0dHJzLmF1dG9GaWxsVm1dO1xyXG4gICAgICAgIGxldCBrZXlzO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBrZXlzWigpIHtcclxuICAgICAgICAgICAga2V5cyA9IGF0dHJzLmF1dG9GaWxsS2V5cy5zcGxpdChcIixcIik7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAga2V5c1ooKTtcclxuXHJcblxyXG5cclxuICAgICAgICAvL3Njb3BlLm91dHB1dHMgPVswLDAsMCwwLDAsMCwwLDAsMCwwXTtcclxuICAgICAgICAvLyBsZXQgc3JjID0gdm1bYXR0cnMuYXV0b0ZpbGxWbVNyY107XHJcbiAgICAgICAgLy8gbGV0IGNiID0gdm1bYXR0cnMuYXV0b0ZpbGxDYl07XHJcblxyXG4gICAgICAgIGxldCB0YXJnZXRBcnIgPSBbXTtcclxuICAgICAgICBzY29wZS5zZWFyY2hNb2RlbCA9IFtdO1xyXG4gICAgICAgIGlmICghdGFyZ2V0QXJyLmxlbmd0aCkgbWFwKCk7XHJcblxyXG4gICAgICAgIGxldCBpbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBsZXQgZWwgPSBcIjxkaXYgbmctY2xpY2s9J3NlYXJjaFRoaXMoKScgY2xhc3M9J3NlYXJjaCc+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8aW5wdXQgY2xhc3M9J2RhdGEtc2VhcmNoJyB0eXBlPSd0ZXh0JyBuZy1tb2RlbD0nc2VhcmNoTW9kZWwnIG5nLWNoYW5nZT0naW5wdXRDaGFuZ2VkKCknPlwiICtcclxuICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nc2VhcmNoLW91dHB1dCc+PGRpdiBjbGFzcz0naXRlbSBpdGVtLWxhYmVsIHNlYXJjaC1vdXRwdXQtc2luZ2xlJyBuZy1yZXBlYXQ9J3NlYXJjaE91dHB1dCBpbiBvdXRwdXRzIHRyYWNrIGJ5ICRpbmRleCcgPlwiICtcclxuICAgICAgICAgICAgICAgIFwiPHNwYW4gbmctY2xpY2s9J2FjdGl2YXRlU2VhY2hPdXRwdXQoc2VhcmNoT3V0cHV0KScgY2xhc3M9Jyc+e3tzZWFyY2hPdXRwdXQubmFtZX19PC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PlwiO1xyXG5cclxuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJGNvbXBpbGUoZWwpKHNjb3BlKSlcclxuICAgICAgICB9KCk7XHJcblxyXG4gICAgICAgIC8vRXZlbnQgbGlzdGVuZXJzXHJcbiAgICAgICAvKiBzY29wZS5zZWFyY2hUaGlzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGF0dHJzLCBhdHRycy5hdXRvRmlsbFZtVGFyZ2V0KVxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHNyYyxhdHRycy5hdXRvRmlsbFZtU3JjLCB2bVthdHRycy5hdXRvRmlsbFZtU3JjXSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2VhcmNoXCIsIHZtKTtcclxuXHJcbiAgICAgICAgfTsqL1xyXG4gICAgICAgIHNjb3BlLmlucHV0Q2hhbmdlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImlucHV0ISB2YWx1ZTpcIiwgc2NvcGUuc2VhcmNoTW9kZWwpO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldEFyci5sZW5ndGgpIG1hcCgpO1xyXG4gICAgICAgICAgICBzZWFyY2hCeU1vZGVsKCk7XHJcbiAgICAgICAgICAgIHZtLnNlYWNoTW9kZWwgPSAgc2NvcGUuc2VhY2hNb2RlbDtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcImlucHV0ISB2YWx1ZTpcIiwgc2NvcGUub3V0cHV0cyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBzY29wZS5hY3RpdmF0ZVNlYWNoT3V0cHV0ID0gZnVuY3Rpb24odmFsKXtcclxuICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImlucHV0ISB2YWx1ZTpcIiwgdmFsKTtcclxuICAgICAgICAgICAgc2NvcGUuc2VhY2hNb2RlbCA9IHZhbDtcclxuICAgICAgICAgICAgdm0uc2VhY2hNb2RlbCA9IHZhbDtcclxuICAgICAgICAgICAgZWxlbWVudC5maW5kKFwiaW5wdXRcIilbMF0udmFsdWUgPSB2YWwubmFtZTtcclxuICAgICAgICAgICAgc2NvcGUub3V0cHV0cyA9IFtdO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5wdXQhIHZhbHVlOlwiLCBlbGVtZW50LmZpbmQoXCJpbnB1dFwiKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBTZWFyY2ggZnVuY3Rpb25cclxuICAgICAgICAgKiBJZiB0aGUga2V5cyBhcmUgYW4gYXJyYXkgZmluZCBlYWNoXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gbWFwKCkge1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhrZXlzLCBrZXlzIGluc3RhbmNlb2YgQXJyYXkpXHJcbiAgICAgICAgICAgIGlmIChrZXlzIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwia2V5c1wiLGtleXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlY3Vyc2lvbih2bVthdHRycy5hdXRvRmlsbFZtU3JjXSwga2V5c1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSByZWN1cnNpb24odm1bYXR0cnMuYXV0b0ZpbGxWbVNyY10sIGtleXMpO1xyXG5cclxuICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICogUmVjdXJzaW9uIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBmdW5jdGlvbiByZWN1cnNpb24oYXJyLCBwcm9wKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFycltpXSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYXllcnMucHVzaChpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2lvbihhcnJbaV0sIHByb3ApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFycltpXVtwcm9wXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sYXllcnMucHVzaChpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEFyci5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOmFycltpXVtwcm9wXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzczphcnJbaV0uX2lkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwia2V5IGZvdW5kXCIsIHRhcmdldEFycltpXSxhcnJbaV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYXJyIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGFycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBwcm9wKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0QXJyLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6YXJyW3Byb3BdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOmFyci5faWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcImtleSBmb3VuZFwiLCBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFycltrZXldIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbGF5ZXJzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2lvbihhcnJba2V5XSwgcHJvcClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy91c2VyIGFjdGl2YXRlZCBzZWFyY2hcclxuICAgICAgICAvL3NlYXJjaE1vZGVsIG5vdyBoYXMgbmV3IHZhbFxyXG5cclxuICAgICAgICBmdW5jdGlvbiBzZWFyY2hCeU1vZGVsKCkge1xyXG4gICAgICAgICAgICBpZiAoIXNjb3BlLnNlYXJjaE1vZGVsLmxlbmd0aCl7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5vdXRwdXRzQWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2NvcGUub3V0cHV0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlbGVtZW50LmZpbmQoXCJkaXZcIikpXHJcbiAgICAgICAgICAgIGZpbmRUYXJnZXQoKTtcclxuICAgICAgICAgICAgZm9ybWF0VGFyZ2V0KCk7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGZpbmRUYXJnZXQoKSB7XHJcbiAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPHRhcmdldEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihmaW5kU2ltcGxlKHRhcmdldEFycltpXSk+LTEpIHNjb3BlLm91dHB1dHMucHVzaCh0YXJnZXRBcnJbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHNjb3BlLm91dHB1dHMubGVuZ3RoID49MTApIHJldHVybjtcclxuICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnVuY3Rpb24gZm9ybWF0VGFyZ2V0KCl7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXRBcnIuc29ydChmdW5jdGlvbihhLGIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaW5kU2ltcGxlKGEpIC0gZmluZFNpbXBsZShiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnVuY3Rpb24gZmluZFNpbXBsZShhKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHNjb3BlLnNlYXJjaE1vZGVsLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICAgLypcclxuICAgICAgICAgZWxzZSBzY29wZS5vdXRwdXRzID17fTtcclxuICAgICAgICAgfSovXHJcbiAgICAgICAgLypcclxuICAgICAgICBmdW5jdGlvbiBzZWFyY2hCeU1vZGVsICgpIHtcclxuICAgICAgICAgICAgaWYgKHNjb3BlLnNlYXJjaE1vZGVsLmxlbmd0aD4wKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNjb3BlLm91dHB1dHMpIHtzY29wZS5vdXRwdXRzID0ge319O1xyXG4gICAgICAgICAgICAgICAgc2VhcmNoT2JqKGZhbHNlLFtcInBlcnNvbmFsXCJdKTtcclxuICAgICAgICAgICAgICAgIHNlYXJjaE9iaih0cnVlLHNjb3BlLmtleXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Ugc2NvcGUub3V0cHV0cyA9e307XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHNlYXJjaE9iaiAoaW5uZXIsIHByb3BzKSB7XHJcbiAgICAgICAgICAgIHNlYXJjaFRoaXMgPSBpbm5lciA/IHNjb3BlLm1haW4uc2VjdGlvbnMgOiBzY29wZS5tYWluO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGsgaW4gc2VhcmNoVGhpc1twcm9wc1tpXV0uY29udGVudCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoc2VhcmNoVGhpc1twcm9wc1tpXV0uY29udGVudFtrXS52YWx1ZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGVja1RoaXMoc2VhcmNoVGhpc1twcm9wc1tpXV0uY29udGVudFtrXSxcInZhbHVlXCIpfHxjaGVja1RoaXMoc2VhcmNoVGhpc1twcm9wc1tpXV0uY29udGVudFtrXSxcImxhYmVsXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiTUFUQ0hcIixzY29wZS5tYWluW3Byb3BzW2ldXS5jb250ZW50W2tdKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5vdXRwdXRzW2tdID0gc2VhcmNoVGhpc1twcm9wc1tpXV0uY29udGVudFtrXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLm91dHB1dHNba10pIGRlbGV0ZSBzY29wZS5vdXRwdXRzW2tdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgICBmdW5jdGlvbiBjaGVja1RoaXMgKG9iaixwcm9wKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmpbcHJvcF0udG9Mb3dlckNhc2UoKS5pbmRleE9mKHNjb3BlLnNlYXJjaE1vZGVsLnRvTG93ZXJDYXNlKCkpPi0xO1xyXG4gICAgICAgIH0qL1xyXG5cdH1cclxufSIsIi8qKlxyXG4qIERhdGEgRmFjdG9yeVxyXG4qIEBkZXNjIGNvbW11bmljYXRlcyB3aXRoIHRoZSBhcGksIHJldHVybnMgcHJvbWlzZXMgb2YgZGF0YVxyXG4qL1xyXG5cclxuYW5ndWxhci5tb2R1bGUoQVBQTkFNRSkuZmFjdG9yeShcImRhdGFGYWN0XCIsZGF0YUZhY3QpO1xyXG5cclxuLy9kYXRhRmFjdC4kaW5qZWN0ID0gW1wiXCJdXHJcblxyXG5mdW5jdGlvbiBkYXRhRmFjdChodHRwRmFjdCwgJHEsICR0aW1lb3V0KXtcclxuXHJcbiAgICAvL3RoaXNcclxuXHRsZXQgZGF0YUYgPSB7fTtcclxuXHJcbiAgICAvL2RhdGEgd2UncmUgc2VydmluZ1xyXG4gICAgZGF0YUYuY2FtcHVzZXMgPSBbXTtcclxuICAgIGRhdGFGLndlZWtzID0gW107XHJcblxyXG4gICAgLy91c2VkIHRvIHBhcnNlIHRoZSB3ZWVrIG51bVxyXG4gICAgbGV0IGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgIC8vY2hlY2sgdGhlc2UgaW4gZ2V0dGVyc1xyXG4gICAgLy9pZiBkYXRhIG5vdCB5ZXQgbG9hZGVkIGZyb20gQVBJICgpPT4gdGhhdCdzIGEgcGFkZGxpbidcclxuICAgIGxldCBwcm9taXNlcyA9e1xyXG4gICAgICAgIGNhbXB1c2VzIDogZmFsc2UsXHJcbiAgICAgICAgY2xhc3NlcyA6IGZhbHNlLFxyXG4gICAgICAgIHdlZWtzOmZhbHNlXHJcbiAgICB9O1xyXG5cclxuICAgIC8vUHVibGljIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBHZXQgY2FtcHVzZXMgZGF0YSBmcm9tIEFQSVxyXG4gICAgICovXHJcbiAgICBkYXRhRi5pbml0ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkRhdGEgZmFjdG9yeSBpbml0aWFsaXplZCwgZ2V0dGluZyBkYXRhXCIpXHJcbiAgICAgICAgaHR0cEZhY3QuZ2V0KFwiL2NhbXB1c1wiKS50aGVuKChkKT0+e1xyXG4gICAgICAgICAgICBkYXRhRi5jYW1wdXNlcyA9IGQuZGF0YTtcclxuICAgICAgICAgICAgcHJvbWlzZXMuY2FtcHVzZXMgPSB0cnVlO1xyXG4gICAgICAgICAgICBkYXRhRi5pbml0Q2xhc3NlcygpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKChlcnIpPT57XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImVyckBkYXRhZmFjdCBjYW1wdXNcIixlcnIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKlxyXG4gICAgKiBHZXQgY2xhc3NlcyBkYXRhIGZyb20gQVBJXHJcbiAgICAgKi9cclxuICAgIGRhdGFGLmluaXRDbGFzc2VzID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgLy9Bc3luYyBzdGVwIGZ1bmNcclxuICAgICAgICBmdW5jdGlvbiBzdGVwKGkpIHtcclxuICAgICAgICAgICAgaHR0cEZhY3QuZ2V0KFwiL2NhbXB1cy9cIiArIGVuY29kZVVSSShkYXRhRi5jYW1wdXNlc1tpXS5uYW1lKSArIFwiL2NsYXNzZXNcIikudGhlbigoZCk9PiB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZUNhbXB1c2VzKGQuZGF0YSwgXCJjbGFzc2VzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYoaTxkYXRhRi5jYW1wdXNlcy5sZW5ndGgtMSkgc3RlcChpKz0xKTtcclxuICAgICAgICAgICAgICAgIGVsc2V7ICAgLy9DbGFzc2VzIGRvbmVcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNsYXNzZXMgZG9uZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5jbGFzc2VzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhRi5pbml0V2Vla3MoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ZXAoMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBHZXQgd2Vla3MgZGF0YSBmcm9tIEFQSVxyXG4gICAgICovXHJcbiAgICBkYXRhRi5pbml0V2Vla3MgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAvL0FzeW5jIHN0ZXAgZnVuY1xyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAoaSkge1xyXG4gICAgICAgICAgICBodHRwRmFjdC5nZXQoXCIvY2FtcHVzL1wiICsgZW5jb2RlVVJJKGRhdGFGLmNhbXB1c2VzW2ldLm5hbWUpICsgXCIvd2Vla3NcIikudGhlbigoZCk9PiB7XHJcbiAgICAgICAgICAgICAgICBkYXRhRi53ZWVrcy5wdXNoKGQuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBpZihpPGRhdGFGLmNhbXB1c2VzLmxlbmd0aC0xKSBzdGVwKGkrPTEpO1xyXG4gICAgICAgICAgICAgICAgZWxzZXsgLy93ZWVrcyBkb25lXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMud2Vla3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwid2Vla3MgZG9uZVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ZXAoMCk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgLypcclxuICAgICBHZXR0ZXJzXHJcbiAgICAgKi9cclxuXHJcbiAgICBkYXRhRi5nZXRXZWVrRGF0YSA9IGZ1bmN0aW9uKHNlYWNoTW9kZWwpe1xyXG5cclxuICAgICAgICBsZXQgdyA9IG5ldyBEYXRlKGRhdGUpLmdldFdlZWsoKTtcclxuXHJcbiAgICAgICAgLy9XZWVrcyA9IGFsbCBjYW1wdXNlcyBhbGwgd2Vla3NcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZGF0YUYud2Vla3MubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIC8vV2Vla3NbaV0gPSBhbGwgd2Vla3MgZnJvbSAxIGNhbXB1c1xyXG4gICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZGF0YUYud2Vla3NbaV0ubGVuZ3RoO2orKyl7XHJcbiAgICAgICAgICAgICAgICAvL1dlZWtzW2ldW2pdID0gZGF0YSBmcm9tIDEgd2Vla3MgZnJvbSAxIGNhbXB1c1xyXG4gICAgICAgICAgICAgICAgLy9IYXMgY2xhc3M6YXNkYXNkICwgd2Vla051bWJlcjo0OVxyXG4gICAgICAgICAgICAgICAgaWYoZGF0YUYud2Vla3NbaV1bal0uY2xhc3M9PT1zZWFjaE1vZGVsLmNsYXNzJiZkYXRhRi53ZWVrc1tpXVtqXS53ZWVrTnVtYmVyPT09dyl7XHJcbiAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWF0Y2ghXCIsZGF0YUYud2Vla3NbaV1bal0sdyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YUYud2Vla3NbaV1bal0ubmFtZSA9IHNlYWNoTW9kZWwubmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFGLndlZWtzW2ldW2pdO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qXHJcbiAgICAqIENhbXB1cyB8IENsYXNzIHwgV2Vla1xyXG4gICAgKiBJZiBkYXRhIG5vdCB5ZXQgbG9hZGVkIHJlc29sdmUsIHdhaXQgYSBzZWMsIGlmIHN0aWxsIG5vdCByZWplY3RcclxuICAgICAqL1xyXG4gICAgZGF0YUYuZ2V0Q2FtcHVzID0gZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUsIHJlamVjdCk9PntcclxuICAgICAgICAgICAgY2hlY2tGb3JTdGF0dXNSZXR1cm5Qcm9taXNlKFwiY2FtcHVzZXNcIixcImNhbXB1c2VzXCIsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgZGF0YUYuZ2V0Q2FtcHVzRGF0YSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuICRxKChyZXNvbHZlLCByZWplY3QpPT57XHJcbiAgICAgICAgICAgIGNoZWNrRm9yU3RhdHVzUmV0dXJuUHJvbWlzZShcImNsYXNzZXNcIixcImNhbXB1c2VzXCIsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgZGF0YUYuZ2V0Q2FtcHVzV2Vla3MgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiAkcSgocmVzb2x2ZSwgcmVqZWN0KT0+e1xyXG4gICAgICAgICAgICBjaGVja0ZvclN0YXR1c1JldHVyblByb21pc2UoXCJ3ZWVrc1wiLFwid2Vla3NcIiwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gYSB3ZWVrIHNjaGVkdWxlXHJcbiAgICAgKiBOb3RlIHRoYXQgd2UgY2FudCByZXR1cm4gc29tZXRoaW5nIHdlIGRvbid0IGhhdmUgLT4gbWFrZSBzdXJlIHdlIGhhdmUgdGhlIGRhdGEgZmlyc3QsIHRoZW4gcGFyc2VcclxuICAgICAqIEBwYXJhbSBjdXJyZW50QnlTdGF0ZSAtIG9iajogd2VlayBudW1iZXIsIGNsYXNzIG5hbWUgT1BUSU9OQUwgY2xhc3MgaWRcclxuICAgICAqIEByZXR1cm4gcHJvbWlzZSBvZiBkYXRhXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICBkYXRhRi5nZXRTY2hlZHVsZSA9IGZ1bmN0aW9uKGN1cnJlbnRCeVN0YXRlKXtcclxuICAgICAgICByZXR1cm4gJHEoKHJlc29sdmUsIHJlamVjdCk9PntcclxuXHJcbiAgICAgICAgICAgIGxldCByZXR1cm5WYWw7XHJcbiAgICAgICAgICAgIGlmKHByb21pc2VzLndlZWtzKSBtYWluTG9vcCgpO1xyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoKCk9PntcclxuICAgICAgICAgICAgICAgICAgICBpZihwcm9taXNlcy53ZWVrcykgbWFpbkxvb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHJlamVjdChcIkFQSSB1bmF2YWlsYWJsZSBhdCB0aGlzIHRpbWUsIHNvIHNvcnJ5XCIpXHJcbiAgICAgICAgICAgICAgICB9LDUwMDApXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIG1haW5Mb29wKCl7XHJcbiAgICAgICAgICAgICAgICBpZighY3VycmVudEJ5U3RhdGUuY2xhc3NJZCkgZ2V0Q2xhc3NEYXRhKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjdXJyZW50QnlTdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGdldFdlZWtEYXRhU2NoZWR1bGUoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vcHJpdmF0ZSBtYXBwaW5nIGZ1bmN0aW9uLCBmaW5kIGNsYXNzIGlkIGJ5IG5hbWVcclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0Q2xhc3NEYXRhKCl7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8IGRhdGFGLmNhbXB1c2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaiA9IDA7ajxkYXRhRi5jYW1wdXNlc1tpXS5jbGFzc2VzLmxlbmd0aDtqKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YUYuY2FtcHVzZXNbaV0uY2xhc3Nlc1tqXS5uYW1lID09PSBjdXJyZW50QnlTdGF0ZS5uYW1lKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRCeVN0YXRlLmNsYXNzSWQgPSBkYXRhRi5jYW1wdXNlc1tpXS5jbGFzc2VzW2pdLl9pZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0V2Vla0RhdGFTY2hlZHVsZSgpe1xyXG4gICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhRi53ZWVrcyk7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZGF0YUYud2Vla3MubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGRhdGFGLndlZWtzW2ldLmxlbmd0aDtqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFGLndlZWtzW2ldW2pdLmNsYXNzID09PSBjdXJyZW50QnlTdGF0ZS5jbGFzc0lkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhRi53ZWVrc1tpXVtqXS5uYW1lID0gY3VycmVudEJ5U3RhdGUubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhRi53ZWVrc1tpXVtqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL1ByaXZhdGVcclxuICAgIC8qXHJcbiAgICAqIElmIGRhdGEgbm90IHlldCBsb2FkZWQgcmVzb2x2ZSwgd2FpdCBhIHNlYywgaWYgc3RpbGwgbm90IHJlamVjdFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclN0YXR1c1JldHVyblByb21pc2UocCwgZGF0YSwgcmVzb2x2ZSwgcmVqZWN0KXtcclxuICAgICAgICBpZihwcm9taXNlc1twXSkgcmVzb2x2ZShkYXRhRltkYXRhXSk7XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgJHRpbWVvdXQoKCk9PntcclxuICAgICAgICAgICAgICAgIGlmKHByb21pc2VzW3BdKSByZXNvbHZlKGRhdGFGW2RhdGFdKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgcmVqZWN0KFwiQVBJIHVuYXZhaWxhYmxlIGF0IHRoaXMgdGltZSwgc28gc29ycnlcIilcclxuICAgICAgICAgICAgfSw1MDAwKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgKiBBc3NpZ24gYSBjYW1wdXMgaXQncyBjbGFzc2VzXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlQ2FtcHVzZXMoZGF0YSwgayl7XHJcbiAgICAgICAgZm9yKGxldCBqID0gMDtqPGRhdGFGLmNhbXB1c2VzLmxlbmd0aDtqKyspe1xyXG4gICAgICAgICAgICBpZihkYXRhRi5jYW1wdXNlc1tqXS5faWQgPT09IGRhdGFbMF0uY2FtcHVzKXtcclxuICAgICAgICAgICAgICAgIGRhdGFGLmNhbXB1c2VzW2pdW2tdID0gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkYXRhRi5pbml0KCk7IC8vc2luZ2xldG9ucyA8M1xyXG5cdHJldHVybiBkYXRhRjtcclxufVxyXG5cclxuXHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGFkbWluIG9uIDI2LjExLjIwMTUuXHJcbiAqL1xyXG4vKlxyXG4qIG5nLWNvbnRyb2xsZXJcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKFwibHVra2FyaVwiKS5jb250cm9sbGVyKFwiZmluZEN0cmxcIixmaW5kQ3RybCk7XHJcblxyXG4vL2ZpbmRDdHJsLiRpbmplY3QgPSBbXCJcIl1cclxuXHJcbmZ1bmN0aW9uIGZpbmRDdHJsKGRhdGFGYWN0LHNjaGVkdWxlRmFjdCwgJHN0YXRlKXtcclxuXHJcbiAgICAvL3RoaXNcclxuICAgIGxldCB2bSA9IHRoaXM7XHJcblxyXG4gICAgLy9JTklUXHJcbiAgICAoZnVuY3Rpb24oKXtcclxuICAgICAgICBkYXRhRmFjdC5pbml0KCk7XHJcbiAgICAgICAgZGF0YUZhY3QuZ2V0Q2FtcHVzRGF0YSgpLnRoZW4oKGRhdGEpPT57XHJcbiAgICAgICAgICAgIHZtLmNhbXB1c2VzID0gZGF0YTtcclxuXHJcbiAgICAgICAgICAgLyogZGF0YUZhY3QuZ2V0Q2FtcHVzV2Vla3MoKS50aGVuKChkYXRhKT0+e1xyXG4gICAgICAgICAgICAgICAgdm0ud2Vla3MgPSBkYXRhO1xyXG5cclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycik9PntcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxyXG4gICAgICAgICAgICB9KSovXHJcbiAgICAgICAgfSkuY2F0Y2goKGVycik9PntcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSkoKTtcclxuXHJcbiAgICB2bS5zZWxlY3RDYW1wdXNPckNsYXNzID0gZnVuY3Rpb24oY2xhc3NPckNhbXB1cyl7XHJcbiAgICAgICAgY29uc29sZS5sb2coY2xhc3NPckNhbXB1cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vRXZlbnQgbGlzdGVuZXJzXHJcbiAgICAvL1RIRSBGSU5EIEFDVElPTlxyXG4gICAgdm0uZmluZFNjaGVkdWxlID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2codm0uc2VhY2hNb2RlbCk7XHJcbiAgICAgICAgLy9GaW5kIHdlZWsgYW5kIHNldCBhcyBhY3RpdmVcclxuICAgICAgICBsZXQgdyA9IGRhdGFGYWN0LmdldFdlZWtEYXRhKHZtLnNlYWNoTW9kZWwpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHcpO1xyXG4gICAgICAgIHNjaGVkdWxlRmFjdC5zZXRTY2hlZHVsZSh3KTtcclxuICAgICAgICAvL2dvdG9cclxuICAgICAgICAkc3RhdGUuZ28oXCJzY2hlZHVsZS5jbGFzcy53ZWVrXCIsIHtcclxuICAgICAgICAgICAgY05hbWU6ZW5jb2RlVVJJKHcubmFtZSksXHJcbiAgICAgICAgICAgIHduOmVuY29kZVVSSSh3LndlZWtOdW1iZXIpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vUHJpdmF0ZVxyXG5cclxuICAgIC8qXHJcbiAgICAqIFBhcnNlIGNvcnJlY3Qgd2hlbiBjbGFzcyAmIGRhdGUga25vd25cclxuICAgICogQHJldHVybiB3ZWVrIG9iamVjdFxyXG4gICAgICovXHJcblxyXG5cclxufVxyXG5cclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgYWRtaW4gb24gMjYuMTEuMjAxNS5cclxuICovXHJcbi8qXHJcbiogbmctZmFjdG9yeVxyXG4qL1xyXG5hbmd1bGFyLm1vZHVsZShcImx1a2thcmlcIikuZmFjdG9yeShcImh0dHBGYWN0XCIsaHR0cEZhY3QpO1xyXG5cclxuLy9mYWN0b3J5QS4kaW5qZWN0ID0gW1wiXCJdXHJcblxyXG5mdW5jdGlvbiBodHRwRmFjdCgkaHR0cCl7XHJcblxyXG5cdGxldCBodHRwRiA9IHt9O1xyXG5cclxuICAgIGxldCBhcGlBZGRyID0gXCIvYXBpXCI7XHJcblxyXG4gICAgLy9wdWJsaWNcclxuICAgIC8qXHJcbiAgICAqIEEgc2ltcGxlIGdldCBmdW5jdGlvblxyXG4gICAgKiBAcGFyYW0gcm91dGUgU3RyaW5nXHJcbiAgICAgKi9cclxuICAgIGh0dHBGLmdldCA9IGZ1bmN0aW9uKHJvdXRlKXtcclxuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KGFwaUFkZHIrcm91dGUpO1xyXG4gICAgfTtcclxuXHJcblx0cmV0dXJuIGh0dHBGO1xyXG59XHJcblxyXG5cclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgYWRtaW4gb24gMjguMTEuMjAxNS5cclxuICovXHJcbi8qXHJcbiogICBTY2hlZHVsZXNcclxuKi9cclxuXHJcbmFuZ3VsYXIubW9kdWxlKEFQUE5BTUUpLmNvbnRyb2xsZXIoXCJzY2hlZHVsZUN0cmxcIixzY2hlZHVsZUN0cmwpO1xyXG5cclxuLy9zY2hlZHVsZUN0cmwuJGluamVjdCA9IFtcIlwiXVxyXG5cclxuZnVuY3Rpb24gc2NoZWR1bGVDdHJsKHNjaGVkdWxlRmFjdCl7XHJcblxyXG4gICAgLy90aGlzXHJcbiAgICBsZXQgdm0gPSB0aGlzO1xyXG5cclxuICAgIHZtLmhlbGxvID0gXCJoZWxsb1wiO1xyXG4gICAgY29uc29sZS5sb2codm0uaGVsbG8pO1xyXG4gICAgc2NoZWR1bGVGYWN0LmdldFNjaGVkdWxlKCkudGhlbigoZGF0YSk9PntcclxuICAgICAgICBkYXRhLnNjaGVkdWxlID0gcGFyc2VTY2hlZHVsZXMoZGF0YS5zY2hlZHVsZSk7XHJcbiAgICAgICAgdm0uc2NoZWR1bGVJdGVtID1kYXRhO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHZtLnNjaGVkdWxlSXRlbSk7XHJcbiAgICB9KTtcclxuICAgIGZ1bmN0aW9uIHBhcnNlU2NoZWR1bGVzKGQpe1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTxkLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZFtpXS5zbG90cy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICAvLyAgZFtpXS5zbG90c1tqXS50ZXh0ID0gZFtpXS5zbG90c1tqXS50ZXh0LnJlcGxhY2UoL1xccypAYnJAXFxzKi9naSxcIiZuYnNwO1wiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuIiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgYWRtaW4gb24gMjguMTEuMjAxNS5cclxuICovXHJcbi8qKlxyXG4gKiBTY2hlZHVsZSBmYWN0b3J5XHJcbiAqIEBkZXNjIHN0b3JlIHNjaGVkdWxlIGRhdGEsIGdldCBvbmUgaWYgbm90IGV4aXRzXHJcbiAqL1xyXG5hbmd1bGFyLm1vZHVsZShBUFBOQU1FKS5mYWN0b3J5KFwic2NoZWR1bGVGYWN0XCIsc2NoZWR1bGVGYWN0KTtcclxuXHJcbi8vc2NoZWR1bGVGYWN0LiRpbmplY3QgPSBbXCJcIl1cclxuXHJcbmZ1bmN0aW9uIHNjaGVkdWxlRmFjdCgkc3RhdGVQYXJhbXMsIGRhdGFGYWN0LCAkcSl7XHJcblxyXG4gICAgLy90aGlzXHJcblx0bGV0IHNjaGVkdWxlID0ge307XHJcblxyXG4gICAgLy90aGUgb25lIHdlJ3JlIHNlcnZpbmcgdG8gdGhlIGNvbnRyb2xsZXJcclxuICAgIGxldCBhY3RpdmVTY2hlZHVsZSA9e1xyXG4gICAgICAgIHdlZWtOdW1iZXI6IG51bGwsXHJcbiAgICAgICAgbmFtZTogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgY3VycmVudEJ5U3RhdGUgPSB7fTtcclxuXHJcbiAgICAvL2FyZSB3ZSBzdXJlIHRoYXQgdGhlIHNjaGVkdWxlIGlzIHRoZSByaWdodCBvbmU/XHJcbiAgICBsZXQgY29tcGxldGU7XHJcblxyXG4gICAgLy9Qcml2YXRlIGZ1bmN0aW9uc1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBQYXJzZSBzdGF0ZSBwYXJhbXMgLSBkbyB0aGV5IG1hdGNoIHRoZSBzY2hlZHVsZSB3ZSBoYXZlP1xyXG4gICAgKiBJZiAhbWF0Y2ggfHwgd2UgZG9uJ3QgaGF2ZSBhIHNjaGVkdWxlXHJcbiAgICAqICAgR2V0IHRoZSBjb3JyZWN0IG9uZSBmb3IgZGF0YWZhY3QgYWNjb3JkaW5nIHRvIHN0YXRlcGFyYW1zXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlU3RhdGUoKSB7XHJcbiAgICAgICAgY3VycmVudEJ5U3RhdGUud2Vla051bWJlciA9ICRzdGF0ZVBhcmFtcy53bjtcclxuICAgICAgICBjdXJyZW50QnlTdGF0ZS5uYW1lID0gJHN0YXRlUGFyYW1zLmNOYW1lO1xyXG4gICAgICAgIGlmKGN1cnJlbnRCeVN0YXRlLndlZWtOdW1iZXI9PT1hY3RpdmVTY2hlZHVsZS53ZWVrTnVtYmVyJiZjdXJyZW50QnlTdGF0ZS5uYW1lPT09YWN0aXZlU2NoZWR1bGUubmFtZSkgY29tcGxldGUgPSB0cnVlO1xyXG4vKiAgICAgICAgZWxzZSBkYXRhRmFjdC5nZXRTY2hlZHVsZShjdXJyZW50QnlTdGF0ZSkudGhlbigoZGF0YSk9PntcclxuXHJcbiAgICAgICAgfSk7Ki9cclxuICAgIH1cclxuXHJcbiAgICAvL1B1YmxpYyBmdW5jdGlvbnNcclxuXHJcbiAgICAvL1NldHRlcnMgJiBHZXR0ZXJzXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gb2JqXHJcbiAgICAgKi9cclxuICAgIHNjaGVkdWxlLnNldFNjaGVkdWxlID0gZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICBhY3RpdmVTY2hlZHVsZSA9IG9iajtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKkBkZXNjIEdldCB0aGUgc2NoZWR1bGUgd2UncmUgdXNpbmdcclxuICAgICAqIEByZXR1cm4gcHJvbWlzZSwgdGhlbiB0aGUgZGF0YVxyXG4gICAgICogIGlmIHdlIGRvbid0IGhhdmUgaXQgd2UnbGwgaGF2ZSB0byBwYXJzZSBpdCBmcm9tIHN0YXRlcGFyYW1zXHJcbiAgICAgKiAgICAgIGFuZCB0aGUgZ2V0IGlmIGZyb20gdGhlIGRhdGEgZmFjb3RyeVxyXG4gICAgICovXHJcbiAgICBzY2hlZHVsZS5nZXRTY2hlZHVsZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuICRxKChyZXNvbHZlLHJlamVjdCk9PntcclxuXHJcbiAgICAgICAgICAgIHBhcnNlU3RhdGUoKTtcclxuICAgICAgICAgICAgaWYoY29tcGxldGUpIHJlc29sdmUoYWN0aXZlU2NoZWR1bGUpO1xyXG5cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIGRhdGFGYWN0LmdldFNjaGVkdWxlKGN1cnJlbnRCeVN0YXRlKS50aGVuKChzY2gpPT57XHJcbiAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGUuc2V0U2NoZWR1bGUoc2NoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFjdGl2ZVNjaGVkdWxlKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycik9PntcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGVycilcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgIH07XHJcblxyXG5cclxuXHRyZXR1cm4gc2NoZWR1bGU7XHJcbn1cclxuXHJcblxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
