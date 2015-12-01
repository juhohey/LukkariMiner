"use strict";

/*
* Utility functions
*/

var MyModule = function MyModule() {
    //this
    var myModule = {};

    //Week lookup for date
    Date.prototype.getWeek = function () {
        var onejan = new Date(this.getFullYear(), 0, 1);
        return Math.ceil(((this - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    };

    return myModule;
};

module.exports = MyModule();