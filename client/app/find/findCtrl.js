/**
 * Created by admin on 26.11.2015.
 */
/*
* ng-controller
*/

angular.module("lukkari").controller("findCtrl",findCtrl);

//findCtrl.$inject = [""]

function findCtrl(dataFact,scheduleFact, $state){

    //this
    let vm = this;

    //INIT
    (function(){
        dataFact.init();
        dataFact.getCampusData().then((data)=>{
            vm.campuses = data;

           /* dataFact.getCampusWeeks().then((data)=>{
                vm.weeks = data;

            }).catch((err)=>{
                console.error(err)
            })*/
        }).catch((err)=>{
            console.error(err)
        });

    })();

    vm.selectCampusOrClass = function(classOrCampus){
        console.log(classOrCampus);
    };

    //Event listeners
    //THE FIND ACTION
    vm.findSchedule = function(){

        console.log(vm.seachModel);
        //Find week and set as active
        let w = dataFact.getWeekData(vm.seachModel);
        console.log(w);
        scheduleFact.setSchedule(w);
        //goto
        $state.go("schedule.class.week", {
            cName:encodeURI(w.name),
            wn:encodeURI(w.weekNumber)
        });
    };

    //Private

    /*
    * Parse correct when class & date known
    * @return week object
     */


}

