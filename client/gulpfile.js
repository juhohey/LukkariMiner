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
    prod: "./dist/app.min.js"
  },
  lib: { /* STATIC REFERENCE TO THE NODE_MODULES FOLDER FOR DEPENDECIES */
    dev: 
    [
        "./lib/angular.js",
        "./lib/angular-ui-router.js",
    ],
    prod:[ 
    "./dist/lib/angular.min.js",
    "./dist/lib/angular-ui-router.min.js",
    ]
  },
  libCSS:{
    dev: 
    [
    "./lib/angular-material.css"],
    prod:[ 
    "./node_modules/angular-material/angular-material.css"]
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
      .pipe(gulp.dest('./dist/assets/css/'))
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
        .pipe(gulp.dest('./dist/app'))
        .pipe(rename('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/app'));
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
gulp.task('default', ["watch",'css','js',"index"]); 