/*
* Angular module
*/

var APPNAME = "lukkari";

angular.module(APPNAME, ['ui.router','ngMaterial','ngSanitize']);

/*
* Utility
 */
Date.prototype.getWeek = function() {
    let onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}; 