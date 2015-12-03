/**
 * Created by admin on 26.11.2015.
 */
/*
* ng-factory
*/
angular.module(APPNAME).factory("httpFact",httpFact);

//factoryA.$inject = [""]

function httpFact($http){

	let httpF = {};

    let apiAddr = "/api";

    //public
    /*
    * A simple get function
    * @param route String
     */
    httpF.get = function(route){
        return $http.get(apiAddr+route);
    };

	return httpF;
}


