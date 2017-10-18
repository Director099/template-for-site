"use strict";

var gulp = require("gulp");
var less = require('gulp-less'); //препроцессор less
var plumber = require("gulp-plumber"); //плагин чтоб не слетело во время ошибок
var postcss = require("gulp-postcss"); // плагин для автопрефикса, минифик
var autoprefixer = require("autoprefixer"); // автопрефикс для браузеров
var server = require("browser-sync").create(); //автоперазгрузки браузера
var mqpacker = require("css-mqpacker"); //обьединение медиавыражения, объединяем «одинаковые селекторы» в одно правило
var minify = require("gulp-csso"); //минификация css
var rename = require("gulp-rename"); // перемейноввывние имя css
var imagemin = require("gulp-imagemin"); // ужимаем изображение
var svgstore = require("gulp-svgstore"); // собиральщик cvg
var svgmin = require("gulp-svgmin"); // свг минификация
var run = require("run-sequence"); //запуск плагинов очередью
var del = require("del"); //удаление ненужных файлов
var concat = require('gulp-concat'); // Конкатинация
var uglify = require('gulp-uglify'); // минификация js
var fileinclude = require('gulp-file-include'); //include html

gulp.task("clean", function() {
  return del("build");
});

gulp.task("copy", function() {
  return gulp.src([
      "fonts/**",
      "img/**",
      "js/**",
      "*.html",
      "*.css"
    ], {
      base: "."
    })
    .pipe(gulp.dest("build"));
});

gulp.task('copyFonts', function() {
  gulp.src('node_modules/font-awesome/fonts/**')
  .pipe(gulp.dest('fonts'));
});

gulp.task("style", function() {
  gulp.src("less/style.less")
    .pipe(plumber())
    .pipe(less())
    .pipe(postcss([
      autoprefixer({browsers: [
        "last 2 versions"
      ]}),
      mqpacker ({
        sort: true
      })
    ]))
    .pipe(gulp.dest("build/."))
    .pipe(minify())
    .pipe(rename("build/style.min.css"))
    .pipe(gulp.dest("."))
    .pipe(server.stream());
});

gulp.task("serve", function() {
  server.init({
    server: "build/."
  });
  gulp.watch("less/**/*.less", ["style"]);
  gulp.watch(['*.html', 'template/*.html'], ['watch:html']);
});

gulp.task('script', function() {
  return gulp.src([
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/jquery-migrate/dist/jquery-migrate.min.js',
    'node_modules/popper.js/dist/umd/popper.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.min.js',
    'node_modules/owl.carousel/dist/owl.carousel.min.js'
    ])
  .pipe(concat('script.js'))
  .pipe(gulp.dest('js'))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('js'));
});


gulp.task("images", function() {
  return gulp.src("img/**/*.{png,jpg,gif}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(gulp.dest("img"));
});

gulp.task("symbols", function() {
  return gulp.src("img/sprite/*.svg")
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("symbols.svg"))
    .pipe(gulp.dest("img"));
});

gulp.task('fileinclude', function() {
  gulp.src(['index.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('build'));
});

gulp.task("build", function(fn) {
  run(
    "clean",
    "fileinclude",
    "copyFonts",
    "copy",
    "script",
    "style",
    "images",
    "symbols",
    fn
  );
});