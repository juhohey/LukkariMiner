/*
*   Schedules Controller
*/

/**
* TODO
*   Set the height of the colums based on duration
*   Also this is required for the text
*   Seems like we cant use the ng-material grid, these columns need to flow
*   
*/

angular.module(APPNAME).controller("scheduleCtrl",scheduleCtrl);

scheduleCtrl.$inject = ["scheduleFact"];

function scheduleCtrl(scheduleFact){

    //this
    let vm = this;

    vm.dayNum = 8;

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
              d[i].slots[j].text = d[i].slots[j].text.replace(/\s*@br@\s*/gi,"@")
            }
        }
        return d;
    }

}

