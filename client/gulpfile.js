/*
* Gulpfile
*   PostCSS
*   Livereload
*   JS: minify & concat & babel
*   Inject
* ---------
* NOTE: change mode on production: dev | prod
* TODO: minify html, handle PostCSS errors, !COPY REQUIRED .js FILES FROM NODE_MODULES (ex. angular)
*/

///// MODE /////
var MODE = "dev";

var gulp = require('gulp'),
	postcss = require('gulp-postcss'),
  	minifyCss = require('gulp-minify-css'),
	watch = require('gulp-watch'),
	concat = require('gulp-concat'),
	inject = require('gulp-inject'),
	livereload = require('gulp-livereload');
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify'),
  babel = require('gulp-babel'),
  sourcemaps = require("gulp-sourcemaps"),
  /* Custom functionality */
  through = require('through2');
  fs = require('fs-extra');
  argv = require('yargs').argv;


//paths
var paths = {
    scripts: './app/**/*.js',
    partials: './app/**/*.html',
    css: ['./assets/css/!(_)*.css'] /* Exclude files beginning with _ */
};

//paths for node-babel
var node = {
  src:"./nodesrc/**/*.js",
  dest:"./nodedist/**/*.js"
};

//compiled source destination
var dest = {
  js: {
    dev: "./app/app.js",
    prod: "./app/app.min.js"
  },
  lib: { /* STATIC REFERENCE TO THE NODE_MODULES FOLDER FOR DEPENDECIES */
    dev:  ["./lib/lib.js"],
    prod:   ["./lib/min/*.js"]
  },
  libCSS:{
    dev: ["./lib/*.css"],
    prod:["./lib/min/*.css"]
	}
};

//Make sourcefile = mode == Development ? byAllMeans : hellNo
var doSourceMaps = {
  init:{
      dev:sourcemaps.init,
      prod:function(){return through.obj(function (file, enc, cb) {cb(null, file);})}
  },
  write:{
     dev:sourcemaps.write,
     prod:function(){return through.obj(function (file, enc, cb) {cb(null, file);})}
  }
};

//Process css
gulp.task('css', function () {
    return gulp.src(paths.css)
      //.pipe(doSourceMaps.init[MODE]())
        .pipe(concat('master.css'))
      .pipe(postcss([
            require('postcss-import'),
            require('postcss-simple-vars'),
            require('postcss-nested'),
            require('postcss-calc'),
            require('cssnext')()
            ])
     
      .on('error', function(err){console.log(err);}))
      .pipe(minifyCss({compatibility: 'ie8'}))
      //.pipe(doSourceMaps.write[MODE]())
      .pipe(gulp.dest('./dist/assets/css/'))
      .pipe(livereload());
}); 

//js schtuff
gulp.task('js', function(){

	//mock app.min.js file so it can be injected
	makeMockMinScript();
	function makeMockMinScript(){
		fs.writeFileSync('./app/app.min.js', "", 'utf8');
	}

    return gulp.src([
		paths.scripts
      ])
        .pipe(doSourceMaps.init[MODE]())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('app.js'))
        .pipe(doSourceMaps.write[MODE]())
        .pipe(gulp.dest('./dist/app'))
        .pipe(rename('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/app'));
    	//.pipe(gulp.dest('./app'));
});

gulp.task('partials', function(){
    return gulp.src(paths.partials)
        .pipe(gulp.dest('./dist/app'));
});


// Rerun the task when a file changes
gulp.task("watch",function () {
    gulp.watch(paths.css, ['css']);
    gulp.watch(paths.scripts,['js','index']);
    gulp.watch('index.html',['index']);
    gulp.watch(paths.partials,['partials','index']);
    gulp.watch('./partials/*.html',['reload']);
    livereload.listen();
});

gulp.task('reload', function () {
    gulp.src(['index.html']).pipe(livereload());
});

//register dependeciens
gulp.task("dependencies", register);
function register(){

  //initial values
  var dirNM = "./node_modules";

  //if no arguments just bundle
  if(!argv.src) return bundleLibs();
  //split args to individual values
  var depArray = argv.src.split(",");

  //after this this is the original amount of files build master file
  var resolved = 0;

  //assing default .js file extension, else use the ones passed
  var fileExtension = argv.files ? argv.files.split(",") : ["js"];

  //loop for each file extension
  for (var i = 0; i < fileExtension.length; i++) {
    console.log("searching for",fileExtension[i],depArray);

    handleFileArray(depArray, ("."+fileExtension[i]));
  };


  /**
  * Handle single array of fields
  * @param ar array of files
  * @param ext, file extensions
  */
  function handleFileArray(ar, ext){

    //find the actual name, remove .js etc
    ar.forEach(function(el, i, arr){

      //Format name = node_modules/name
      var searchFolder = dirNM +"/"+ el;
      //Format name2 = node_modules/name/name.js
      var searchFolderFile = getFileNameWithPath(searchFolder, el, ext);

      //this file is at the root of the dir? the ez pz
      if(exists(searchFolderFile)) copyDependency(searchFolder, el, ext);
      else{
        //recursive search
        function step(path,cb){

          fs.readdir(searchFolder, function(err,files){
            for (var i = 0; i < files.length; i++) {

              //increment folder name
              var searchFolderIncrement = searchFolder + "/"+files[i];
              //test to see if the file is in this folder
              var isDestination = getFileNameWithPath(searchFolderIncrement,el,ext);

              if(exists(isDestination)) return cb(searchFolderIncrement,el);
              else{
                fs.stat(searchFolderIncrement, function(err, res) {
                  if (res.isDirectory()) console.log("dir");
                });
              };
            }
          });
        }

        //Fire the first one
        step(searchFolder, function(dir,file){
          copyDependency(dir,file, ext);
        });
      }
  
    });

  }
  
  //String: dir/file.js
  function getFileNameWithPath (dir,el, fileExtension) {
    return dir+("/"+el+fileExtension);
  }

  //boolean: this path exists ?
  function exists(path){
    return fs.existsSync(path);
  }

  //copy this file to ./lib
  function copyDependency(dir, file, ext){
    resolved++;
    console.log("Copying dependency");

    //NORMAL
    copySync("./dist/lib/","") //dist
    copySync("./lib/","") //lib

     //MIN
    copySync("./lib/min/","") //lib


    function copySync(copyPath, prefix){
    	var fileLocation = getFileNameWithPath(dir, file, (prefix+ext));
  		var fileDestination = copyPath+file+ext;
   		 //Copy file
    	fs.copySync(fileLocation, fileDestination);
    }
    if (resolved===depArray.length) bundleLibs();
  }
  function bundleLibs(){
    gulp.src(
      [
        "./dist/lib/angular.js",
        "./dist/lib/!(angular|lib).js"
      ])
    .pipe(concat('lib.js'))
    .pipe(gulp.dest('./dist/lib'))
    .pipe(gulp.dest('./lib'));

    return gulp.src(
      [
        "./lib/min/angular.min.js",
        "./lib/min/!(angular|lib).js"
      ])
    .pipe(concat('lib.min.js'))
    .pipe(gulp.dest('./dist/lib/min'))
    .pipe(gulp.dest('./lib/min'));

  }
}

//Set mode without having to restart the task
gulp.task("mode", function(){
 	MODE = argv.prod ? "prod" : "dev";
 	console.log("mode chaged to",MODE);
});


//Node babel
gulp.task("babel", function(){
  gulp.watch(node.src, ['doBabel']);
});

gulp.task("doBabel",function(){
  console.log(node.src,node.dest);
   return gulp.src(node.src)
    .pipe(babel({
            presets: ['es2015']
        }))
    .pipe(gulp.dest(node.dest));
});

//indect stuff to index -> output to ./dist/index
gulp.task('index', function () {
    var target = gulp.src(['index.html']);
  // It's not necessary to read the files (will speed up things), we're only after their paths: 
    var sources = gulp.src("./assets/css/master.css", {read: false});
    var sourcesJS = gulp.src(dest.js[MODE], {read: false});
    return target
      .pipe(inject(sources))
      .pipe(inject(sourcesJS))
  	  .pipe(inject(gulp.src(dest.lib[MODE], {read: false}), {name: 'lib'}))
      .pipe(inject(gulp.src(dest.libCSS[MODE], {read: false}), {name: 'libCSS'}))
      .pipe(gulp.dest('./dist'))
      .pipe(livereload());

});
// The default task (called when you run `gulp` from cli)
gulp.task('default', ["watch",'css','js',"index",'dependencies','mode']); 