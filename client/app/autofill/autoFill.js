
/**
* Auto fill | Note this is redundant since we're using ng-material
* @desc *Auto fills searches*
* @param: auto-fill-vm: vm to target
* @param: auto-fill-src: a property of vm to search
* @param: auto-fill-keys: keys to search in src | string or array
* @param: auto-fill-cb: function to execute on user action, passed the key and it's path found
*/

angular.module(APPNAME).directive("autoFill",autoFill);

autoFill.$inject = ["$compile"];

function autoFill($compile){

	return{
		scope:"=",
		link:linkFunc,
		template:"",
		restrict:"E"
	};

	function linkFunc(scope,element,attrs) {

        let vm = scope[attrs.autoFillVm];
        let keys;

        function keysZ() {
            keys = attrs.autoFillKeys.split(",");

        }

        keysZ();



        //scope.outputs =[0,0,0,0,0,0,0,0,0,0];
        // let src = vm[attrs.autoFillVmSrc];
        // let cb = vm[attrs.autoFillCb];

        let targetArr = [];
        scope.searchModel = [];
        if (!targetArr.length) map();

        let init = function () {
            let el = "<div ng-click='searchThis()' class='search'>" +
                "<input class='data-search' type='text' ng-model='searchModel' ng-change='inputChanged()'>" +
                "<div class='search-output'><div class='item item-label search-output-single' ng-repeat='searchOutput in outputs track by $index' >" +
                "<span ng-click='activateSeachOutput(searchOutput)' class=''>{{searchOutput.name}}</span></div></div></div>";

            element.append($compile(el)(scope))
        }();

        //Event listeners
       /* scope.searchThis = function () {
            //console.log(attrs, attrs.autoFillVmTarget)
            //console.log(src,attrs.autoFillVmSrc, vm[attrs.autoFillVmSrc]);
            console.log("search", vm);

        };*/
        scope.inputChanged = function () {
           // console.log("input! value:", scope.searchModel);
            if (!targetArr.length) map();
            searchByModel();
            vm.seachModel =  scope.seachModel;
            //console.log("input! value:", scope.outputs);
        };
        scope.activateSeachOutput = function(val){
           // console.log("input! value:", val);
            scope.seachModel = val;
            vm.seachModel = val;
            element.find("input")[0].value = val.name;
            scope.outputs = [];
            //console.log("input! value:", element.find("input"));
        };

        /*
         * Search function
         * If the keys are an array find each
         */
        function map() {

            //console.log(keys, keys instanceof Array)
            if (keys instanceof Array) {
                for (let i = 0; i < keys.length; i++) {
                    // console.log("keys",keys[i]);
                    recursion(vm[attrs.autoFillVmSrc], keys[i]);
                }
            }
            else recursion(vm[attrs.autoFillVmSrc], keys);

            /*
             * Recursion function
             */
            function recursion(arr, prop) {
                if (arr instanceof Array) {

                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i] instanceof Object) {
                            //layers.push(i);
                            recursion(arr[i], prop);
                        }
                        else if (arr[i][prop]) {
                            //layers.push(i);
                            targetArr.push({
                                name:arr[i][prop],
                                class:arr[i]._id
                            });
                            // console.log("key found", targetArr[i],arr[i])
                        }

                    }
                }
                else if (arr instanceof Object) {
                    for (let key in arr) {
                        if (key === prop) {

                            targetArr.push({
                                name:arr[prop],
                                class:arr._id
                            });
                            //console.log("key found", key)
                        }
                        if (arr[key] instanceof Array) {
                            //layers.push(key);
                            recursion(arr[key], prop)
                        }
                    }
                }
            }
        }

        //user activated search
        //searchModel now has new val

        function searchByModel() {
            if (!scope.searchModel.length){
                scope.outputsActive = false;
                return;
            }
            scope.outputs = [];

           // console.log(element.find("div"))
            findTarget();
            formatTarget();
            function findTarget() {
                 for(let i = 0;i<targetArr.length;i++){
                    if(findSimple(targetArr[i])>-1) scope.outputs.push(targetArr[i]);
                    if(scope.outputs.length >=10) return;
                 }
            }
            function formatTarget(){
                targetArr.sort(function(a,b){
                    return findSimple(a) - findSimple(b);
                })
            }
            function findSimple(a){
                return a.name.toLowerCase().indexOf(scope.searchModel.toLowerCase());
            }

        }
	}
}