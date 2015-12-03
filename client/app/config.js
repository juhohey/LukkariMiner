/*
*	UI Routes
*/
angular.module(APPNAME).config(states,"states");
states.$inject = ['$stateProvider', '$urlRouterProvider'];

function states ($stateProvider, $urlRouterProvider){
	"use strict";
	$urlRouterProvider.otherwise("find");
	var route = "";
	$stateProvider
	.state("find",{
	 	url:"/find",
	 	templateUrl: "/app/find/find.html"
	}) 
	.state("schedule",{
	 	url:route+"/schedule",
	 	templateUrl: "/app/schedule/schedule.html"
	})
		.state("schedule.campus",{
			url:route+"/:campus",
			templateUrl: "/app/schedule/schedule.html"
		})
			.state("schedule.class",{
				url:route+"/:cName",
				templateUrl: "/app/schedule/schedule.html"
			})
				.state("schedule.class.week",{
					url:route+"/:wn",
					templateUrl:"/app/schedule/schedule.html"
				})

}
