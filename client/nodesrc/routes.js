/*
*API routes
*/

let dataCtrl = require("../nodedist/controllers/dataCtrl");

module.exports = function  (app,express) {

	///MAP FUNCTION
	//for ez rest routing
	app.map = function(a, route){
	  route = route || '';
	  for (var key in a) {
	    switch (typeof a[key]) {
	      // { '/path': { ... }}
	      case 'object':
	        app.map(a[key], route + key);
	        break;
	      // get: function(){ ... }
	      case 'function':
	        app[key](route, a[key]);
	        break;
	    }
	  }
	};

	var index = {
		list: function(req,res){
			res.sendFile("index.html");
		}
	};

	// user dataCtrl for all of these
	let datas ={

		//let type:
		// 0: "" (empty index since first is '/')
		// 1: api
		// 2: route
		// 3: additional route / id


		listCampus: function(req,res){
			let type = req.originalUrl.split("/");

			dataCtrl.listCampus(type[3], (err, campuses)=>{
				if(err) res.status(400);
				else res.send(campuses)
			});
		},
		listCampusClasses: function(req,res){
			let type = req.originalUrl.split("/");

			dataCtrl.listCampus(type[3], (err, campuses)=>{
				if(err) res.status(400);
				else res.send(campuses)
			});
		},
		listClass: function(req,res){
			let type = req.originalUrl.split("/");
			//console.log(type[3])
			dataCtrl.listClass(type[3], (err, classes)=>{
				if(err) res.status(400);
				else res.send(classes)
			});
		},
		getScheduleSingle: function(req,res){
			let type = req.originalUrl.split("/");
			console.log(type[3],type[5],type[6])
			dataCtrl.getScheduleSingle(type[3],type[5],type[6], (err, dbRes)=>{
				if(err) res.status(400);
				else res.send(dbRes)
			});
		},
		week:{
			list: function(req,res){
				let type = req.originalUrl.split("/");

				dataCtrl.listCampusWeeks(type[3], (err, weeks)=>{
					if(err) res.status(400);
					else res.send(weeks)
				});
			},
			relevant: function(req,res){
				let type = req.originalUrl.split("/");

				dataCtrl.listCampusWeeks(type[3], (err, weeks)=>{
					if(err) res.status(400);
					else res.send(weeks)
				});
			}
		}


	};

	app.map({
	  '/': {
	    get: index.list
	  }
	});

		//////////////API///////////////////
	// these routes require the token to be accessed

	var apiRoutes = express.Router();

	app.use('/api', apiRoutes);

	//// Api routes map
	app.map({
		'/api/campus': {

	     	get: datas.listCampus,
			'/:campusName': {
				get: datas.listCampus,

				'/weeks': {
					get: datas.week.list,

					'/relevant': {
						get: datas.week.relevant
					}
				},
				'/classes': {
					get: datas.listClass,
					'/:classId': {
						'/:weekNum': {
							get:datas.getScheduleSingle
						}
					}

				}


			} /* /campus name*/
	   	},
	   	'/api/class/:classID': {

			get: datas.listClass,

			'/weeks': {
				get: datas.listClass
			}
	   	}
	});
};