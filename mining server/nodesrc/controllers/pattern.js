
 /*
* Patterns
* @desc holds regex patterns used in parsing
* These dictate wheter this miner works or not
* In case of updates in out target site these need to be updated
*/

let Pattern = function( ) {
    //this
    let patterns = {};
    patterns.dateRange = /\d+\.\d+\.\d+\.+\d+\.\d+\.\d+/;
    patterns.dateRangeSeparator = "...";
    patterns.weekNumber = /\d+:/;
    patterns.timetable = /\d{4}-|\d+:\d+/,
    patterns.header = /.*\d+:.*\d+\.\d+\.\d{4}\.+\d+\.\d+\.\d{4}/;

    patterns.obsolete = /index2014|152735/;
    patterns.mimosa = "mimosa";

    patterns.selector = {
        header: "b b"
    };

    patterns.br = '@br@';

    return patterns;
};

module.exports = Pattern();