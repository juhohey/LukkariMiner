 /*
* week
* @desc parses a week out of mined data
*/
let Pattern = require(__dirname+"/pattern");

let weekFact = function( ) {

    //this
    let week = {};

    //Amount of days in a week, this changes
    let amountOfDays = 0;

    /*
    * Parse date range & week number from mined array
    * @param mined array
     */
    function getHeaderData(textArray) {

        let weekObject = {};

        for(let i = 0;i<textArray.length;i++){
            if(textArray[i].colspan){
                weekObject = regexReplace(textArray[i].text);
                return weekObject;
            }
        }

        //private regex function
        function regexReplace(s){

            let dateRange = "";
            let weekNumber = "";

            //parse out 31.8.2015...4.9.2015
            s.replace(Pattern.dateRange, (subs)=>{
                dateRange = subs;
                return "";
            });
            //parse out 36:
            s.replace(Pattern.weekNumber, (subs)=>{
                weekNumber = subs;
                return "";
            });

            //Remove characters
            weekNumber = weekNumber.replace(/\D/ig, "");

            return {
                "dateRange" :dateRange,
                "weekNumber" :weekNumber
            }
        }
        return weekObject;
    }

    /*
     * Primary function
     * @param mined blob array
     */
    week.parseWeek = function(textArray){

        //Find out the amount of days
        amountOfDays = parseAmountOfDays(textArray);        

        //Parse the header
        var weekObject = getHeaderData(textArray);

        let schedule = [];
        //if an items text begins with " 08:15-09:00"
        //the next 5 items are the schedule for each day
        //save reserved slots here
        let reservedTimeSlots = [];
        //save individual time/date combinations here
        let weekTimeSlot = {};
        weekTimeSlot.slots = [];

        //Daycounter, 0 mon - 4 fri
        let dayCounter = -1;

        for(let i = 0;i<textArray.length;i++){
            //CASES
            // 1) this date has no data = is reserved -> generate empty obj, save to weekTimeSlot
            // 2) this is the time slot string -> save to weekTimeSlot
            // 3) The following items are slots in a time slot ->  save to weekTimeSlot

            //If there's a reserved slot
            //Note: in this case there is'n actual markup -> make an empty element and push
            while(checkReserved(dayCounter)){

                weekTimeSlot.slots.push(
                    { text:Pattern.br, day: dayCounter, reserved:true }
                );
                //console.log("Empty inserted");
                dayCounter ++;
            }

            if(dayCounter===amountOfDays){
                startNewSlot();
            }

            //If we find a time slot
            if(textArray[i].text.match(Pattern.timetable)!=null){ //begins with " 08:"
                //A new time slot begins - a new week so to speka

                dayCounter  = 0;
                weekTimeSlot.time = cleanTimeSlotLabel(textArray[i]);
            }

            //begin check: currently in a week?
            else if(dayCounter>-1) {
                //if this spans multiple slots save it to the reserved array
                if(textArray[i].duration) reservedTimeSlots.push({day:dayCounter, duration:textArray[i].duration-1});
                //in any case push it to the week data obj;
                textArray[i].day = dayCounter;
                weekTimeSlot.slots.push(textArray[i]);
                //console.log("item saved",textArray[i]);
                dayCounter++;
            }



        }

        /*
         * Clear data - it's already pushed to our obj
         */
        function startNewSlot(){

            dayCounter =-1;
            schedule.push(weekTimeSlot);
            weekTimeSlot = {};
            weekTimeSlot.slots = [];
        }

        /*
        * Check the reserved array
        * @param a days number - 0 mon - 4 fri
        * @return boolean: true if this date is reserved
         */
        function checkReserved(dayNum){

            for(let i = 0;i < reservedTimeSlots.length;i++){
                //the slot for this date is reserved
                if(reservedTimeSlots[i].day===dayNum){
                    reservedTimeSlots[i].duration -=1;
                    if (reservedTimeSlots[i].duration === 0) reservedTimeSlots.splice(i,1); //if the reservation is use remove it
                    return true;
                }
            }
            return false;
        }

        /*
        * Clean the time slot object
         */
        function cleanTimeSlotLabel(obj){

            delete obj.duration;
            obj.text = obj.text.replace(/\s/gi,"");
            obj.text = obj.text.substring(0,11);
            return obj;
        }

        function parseAmountOfDays(textArrayArg) {
            
            for (var i = 0; i < textArray.length; i++) {
                // is there a sunday string in our array?
                if(textArray[i].text.toLowerCase().match(/sunday|sunnuntai/gi)!=null) return 7;
            };
            return 5;

        };

        //Join the objects
        weekObject.schedule = schedule;

        //Test function
        function testWeek (argument) {
            for (var i = schedule.length - 1; i >= 0; i--) {
                console.log("TIME TEXT");
                console.log(schedule[i].time.text);
                console.log("*******SLOTS******");
                console.log(schedule[i].slots);
            };
        }
        testWeek();

        return weekObject;

    };//parse
    return week;
};

module.exports = weekFact();
