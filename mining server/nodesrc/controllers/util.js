
 /*
* Utility functions
*/

let MyModule = function( ) {
    //this
    let myModule = {};

    //Week lookup for date
    Date.prototype.getWeek = function() {
        let onejan = new Date(this.getFullYear(), 0, 1);
        return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    };

    return myModule;
};

module.exports = MyModule();