'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/*
*API routes
*/

module.exports = function (app, express) {
	"use strict"
	///MAP FUNCTION
	//for ez rest routing
	;
	app.map = function (a, route) {
		route = route || '';
		for (var key in a) {
			switch (_typeof(a[key])) {
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

	// var users = {
	//   list: function(req, res){
	//     res.send('user list');
	//   },

	//   update: function(req, res){
	//     res.send('user ' + req.params.uid);
	//   },

	//   delete: function(req, res){
	//     res.send('delete users');
	//   },

	//   create: function(req, res){
	//    	userCtrl.create(req,sss, function (err,dbR,stat) {
	//    		if (!err) {
	//    			if(stat){res.status(stat).send(dbR);}
	//    			else{res.send(dbR);}
	//    		}
	//    		else{
	//    			res.send(err);
	//    		}
	//    	});
	//   }
	// };
	var index = {
		list: function list(req, res) {
			res.sendFile("index.html", { "root": "./dist" });
		}
	};

	app.map({
		'/': {
			get: index.list
		}
	});
	// app.map({
	//   '/users': {
	//     get: users.list,
	//     post: users.update,
	//     delete: users.delete,
	//     put: users.create,
	//     '/:uid': {
	//       get: users.get
	//       }
	//     },
	//   '/auth':{
	//   	post: autReq.auth
	//   }
	// });

	// //////////////API///////////////////
	// //these routes require the token to be accessed
	// var apiRoutes = express.Router();
	// app.use('/api', apiRoutes);	
	// //// Api routes map
	// app.map({
	// 	'/api/model': {
	//     	get: userData.list,
	//     	put: userData.save,
	//     	'/:mid': {
	//       		get: models.listOne,
	//       		post: models.update,
	//       		delete: userData.delete,
	//     	}
	//   	},
	//   	'/api/file':{
	//   		put: userData.save,
	//   		get: userData.list
	//   	},
	//   	'/api/prototype':{
	//   		get: userData.list,
	//   		put: userData.save,
	//   		'/:pid': {
	//       		post: userData.update,
	//       		delete: userData.delete,
	//     	}
	//   	},
	//   	'/api/miner':{
	//   		get: userData.list,
	//   		put: userData.save,
	//   		'/:minerId': {
	//       		post: userData.update,
	//       		delete: userData.delete,
	//     	}
	//   	}
	// });
};