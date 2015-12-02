/**
 * Created by admin on 28.11.2015.
 */
/*
*   Schedules
*/

angular.module(APPNAME).controller("scheduleCtrl",scheduleCtrl);

//scheduleCtrl.$inject = [""]

function scheduleCtrl(scheduleFact){

    //this
    let vm = this;

    vm.hello = "hello";
    console.log(vm.hello);
    scheduleFact.getSchedule().then((data)=>{
        data.schedule = parseSchedules(data.schedule);
        vm.scheduleItem =data;
        console.log(vm.scheduleItem);
    });
    function parseSchedules(d){
        for(let i = 0;i<d.length;i++){
            for(let j = 0;j<d[i].slots.length;j++){
              //  d[i].slots[j].text = d[i].slots[j].text.replace(/\s*@br@\s*/gi,"&nbsp;")
            }
        }
        return d;
    }

}

