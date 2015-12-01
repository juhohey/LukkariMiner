
 /*
* Nodemodule
* @desc Does things
*/

let Async = function( ) {
    //this
    let async = {};
/*
    /!*
     * Save each campus
     * @desc Async for loop
     *!/
    async.stepForCampus = function(i, data, cb){
        if(i<data.length){
            saveCampus(data[i].name,"campus");
            i++;
            stepForCampus(i, data, cb);
        }
        else cb();
    };


    /!*
     * Save each class
     * @desc Async for loop
     *!/
    async.stepForClass(i, data, campusName, cb){
        if(i<data.length){
            saveClass(data[i].name, campusName);
            i++;
            stepForClass(i, data, campusName, cb);
        }
        else cb();
    }
    /!*
     * Save each week
     * @desc Async for loop
     *!/
    async.stepForWeek(i, data, className, cb){
        if(i<data.length){
            saveWeek(data, className);
            i++;
            stepForClass(i, data, className, cb);
        }
        else cb();
    }
*/

    return async;
};

module.exports = Async();