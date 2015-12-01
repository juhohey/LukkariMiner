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



//paths
var paths = {
  scripts: './app/**/*.js',
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
    dev: "./dist/app.js",
    prod: "./dist.app.min.js"
  },
  lib: { /* STATIC REFERENCE TO THE NODE_MODULES FOLDER FOR DEPENDECIES */
    dev: ["./node_modules/angular/angular.js", "./node_modules/angular-ui-router/build/angular-ui-router.js"],
    prod: ["./dist/lib/angular.min.js", "./dist/lib/angular-ui-router.min.js"]
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
      .pipe(doSourceMaps.init[MODE]())
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
      .pipe(doSourceMaps.write[MODE]())
      .pipe(gulp.dest('./dist/'))
      .pipe(livereload());
}); 

//js schtuff
gulp.task('js', function(){
    return gulp.src(paths.scripts)
        .pipe(doSourceMaps.init[MODE]())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('app.js'))
        .pipe(doSourceMaps.write[MODE]())
        .pipe(gulp.dest('./dist'))
        .pipe(rename('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});


// Rerun the task when a file changes
gulp.task("watch",function () {
	gulp.watch(paths.css, ['css']);
  gulp.watch(paths.scripts,['js','index']);
  gulp.watch('index.html',['index']);
  gulp.watch('./partials/*.html',['reload']);
  livereload.listen();
});

gulp.task('reload', function () {
    gulp.src(['index.html']).pipe(livereload());
});

//Copy .min files to dest folder
//Dem hacks...
gulp.task('dependencies', function () {
  for (var i = 0; i < dest.lib.dev.length; i++) {
    var minFile = dest.lib.dev[i].split("/");
    minFile[minFile.length-1] = minFile[minFile.length-1].substring(0,minFile[minFile.length-1].length-3) + ".min.js";
    minFile = minFile.join("/");
    fs.copySync(minFile, dest.lib.prod[i]);
  };
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
  var sources = gulp.src([dest.js[MODE], "./dist/*.css"], {read: false});
  return target.pipe(inject(sources))
  	.pipe(inject(gulp.src(dest.lib[MODE], {read: false}), {name: 'lib'}))
    .pipe(gulp.dest('./dist'))
    .pipe(livereload());

});
// The default task (called when you run `gulp` from cli)
gulp.task('default', ["watch",'css','js',"index"]); 