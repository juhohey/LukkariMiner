/*
*   Schedules Controller
*/

angular.module(APPNAME).controller("scheduleCtrl",scheduleCtrl);

scheduleCtrl.$inject = ["scheduleFact"];

function scheduleCtrl(scheduleFact){

    //this
    let vm = this;

    //get this schedule from fact
    scheduleFact.getSchedule().then((data)=>{
        data.schedule = parseSchedules(data.schedule);
        vm.scheduleItem =data;
        console.log(vm.scheduleItem);
    });

    //parse schedule arr to moar suitable form
    function parseSchedules(d){
        for(let i = 0;i<d.length;i++){
            for(let j = 0;j<d[i].slots.length;j++){
              //  d[i].slots[j].text = d[i].slots[j].text.replace(/\s*@br@\s*/gi,"&nbsp;")
            }
        }
        return d;
    }

}

