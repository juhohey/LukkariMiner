/**
 * Created by admin on 28.11.2015.
 */
/**
 * Schedule factory
 * @desc store schedule data, get one if not exits
 */
angular.module(APPNAME).factory("scheduleFact",scheduleFact);

//scheduleFact.$inject = [""]

function scheduleFact($stateParams, dataFact, $q){

    //this
	let schedule = {};

    //the one we're serving to the controller
    let activeSchedule ={
        weekNumber: null,
        name: null
    };

    let currentByState = {};

    //are we sure that the schedule is the right one?
    let complete;

    //Private functions

    /**
    * Parse state params - do they match the schedule we have?
    * If !match || we don't have a schedule
    *   Get the correct one for datafact according to stateparams
     */
    function parseState() {
        currentByState.weekNumber = $stateParams.wn;
        currentByState.name = $stateParams.cName;
        if(currentByState.weekNumber===activeSchedule.weekNumber&&currentByState.name===activeSchedule.name) complete = true;
/*        else dataFact.getSchedule(currentByState).then((data)=>{

        });*/
    }

    //Public functions

    //Setters & Getters
    /**
     *
     * @param obj
     */
    schedule.setSchedule = function(obj){
        activeSchedule = obj;
    };

    /**
     *@desc Get the schedule we're using
     * @return promise, then the data
     *  if we don't have it we'll have to parse it from stateparams
     *      and the get if from the data facotry
     */
    schedule.getSchedule = function(){
        return $q((resolve,reject)=>{

            parseState();
            if(complete) resolve(activeSchedule);

            else{
                dataFact.getSchedule(currentByState).then((sch)=>{
                    schedule.setSchedule(sch);
                    resolve(activeSchedule);
                })
                .catch((err)=>{
                    resolve(err)
                })
            }
        })

    };


	return schedule;
}


