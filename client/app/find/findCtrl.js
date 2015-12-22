/*
* Find Controller
*/

angular.module(APPNAME).controller("findCtrl",findCtrl);

findCtrl.$inject = ["dataFact","scheduleFact", "$state"];

function findCtrl(dataFact,scheduleFact, $state){

    //this
    let vm = this;
    vm.date = new Date();
    vm.seachModel = {};
    //INIT
    //get campus & classes data
    (function(){
        dataFact.getCampusData().then((data)=>{
            console.log("AUTOFILL WORKS")
            vm.campuses = data;

        }).catch((err)=>{
            console.error(err)
        });

    })();

    //Event listeners
    //THE FIND ACTION
    vm.findSchedule = function(){
        if(!vm.seachModel.class) return err("No class specified");
        console.log(vm.seachModel);
        //Find week and set as active
        dataFact.getWeekData(vm.seachModel)
            .then((w)=>{
                console.log(w);
                scheduleFact.setSchedule(w);
                //goto
                $state.go("schedule.campus.class.week", {
                    campus:encodeURI(w.campus),
                    cName:encodeURI(w.name),
                    wn:encodeURI(w.weekNumber)
                });
            }).catch((noScheduleFoundError)=>{
            err("No schedule found");
        });

        function err(s){
            console.log(s)
        }
    };

}


