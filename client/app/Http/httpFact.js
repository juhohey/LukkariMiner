/**
* Http factory
* @desc communicates with the API
*/
angular.module(APPNAME).factory("httpFact",httpFact);

httpFact.$inject = ["$http"];

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


