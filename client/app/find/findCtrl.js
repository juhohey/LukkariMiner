/*
* Find Controller
*/

angular.module(APPNAME).controller("findCtrl",findCtrl);

findCtrl.$inject = ["dataFact,scheduleFact, $state"];

function findCtrl(dataFact,scheduleFact, $state){

    //this
    let vm = this;

    //INIT
    //get campus & classes data
    (function(){
        dataFact.getCampusData().then((data)=>{
            vm.campuses = data;

        }).catch((err)=>{
            console.error(err)
        });

    })();

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

}

