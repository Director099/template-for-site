'use strict';

var gulp = require('gulp');
var less = require('gulp-less'); //препроцессор less
var plumber = require('gulp-plumber'); //плагин чтоб не слетело во время ошибок
var postcss = require('gulp-postcss'); // плагин для автопрефикса, минифик
var autoprefixer = require('autoprefixer'); // автопрефикс для браузеров
var server = require('browser-sync').create(); //автоперазгрузки браузера
var mqpacker = require('css-mqpacker'); //обьединение медиавыражения, объединяем «одинаковые селекторы» в одно правило
var minify = require('gulp-csso'); //минификация css
var rename = require('gulp-rename'); // перемейноввывние имя css
var imagemin = require('gulp-imagemin'); // ужимаем изображение
var svgstore = require('gulp-svgstore'); // собиральщик cvg
var svgmin = require('gulp-svgmin'); // свг минификация
var run = require('run-sequence'); //запуск плагинов очередью
var del = require('del'); //удаление ненужных файлов
var concat = require('gulp-concat'); // Конкатинация
var uglify = require('gulp-uglify'); // минификация js
var fileinclude = require('gulp-file-include'); //include html

gulp.task('clean', function() {
  return del('build');
});

gulp.task('copy', function() {
  return gulp.src([
      'fonts/**',
      'img/**'
    ], {
      base: '.'
    })
    .pipe(gulp.dest('build'));
});

gulp.task('copy:fonts', function() {
  return gulp.src('fonts/**')
  .pipe(gulp.dest('build/fonts'));
});

gulp.task('copy:img', function() {
  return gulp.src('img/**')
  .pipe(gulp.dest('build/img'));
});

gulp.task('style', function() {
  gulp.src('less/style.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(postcss([
      autoprefixer({browsers: [
        'last 1 versions'
      ]}),
      mqpacker ({
        sort: true
      })
    ]))
    .pipe(gulp.dest('build/.'))
    .pipe(minify())
    .pipe(rename('build/style.min.css'))
    .pipe(gulp.dest('.'))
    .pipe(server.stream());
});

gulp.task('html', function() {
  return gulp.src(['*.html'])
    .pipe(plumber())
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('build'));
});

gulp.task('js', function() {
  return gulp.src([
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/jquery-migrate/dist/jquery-migrate.min.js',
    'node_modules/popper.js/dist/umd/popper.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.min.js',
    // 'node_modules/owl.carousel/dist/owl.carousel.min.js',
    'node_modules/jquery-mask-plugin/dist/jquery.mask.min.js',
    'node_modules/scrollup/dist/jquery.scrollUp.min.js',
    'node_modules/jquery-parallax.js/parallax.min.js',
    // 'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.js',
    'js/custom.js'
    ])
  .pipe(plumber())
  .pipe(concat('script.js'))
  .pipe(gulp.dest('build/js'))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('build/js'));
});

gulp.task('images', function() {
  return gulp.src('img/**/*.{png,jpg,gif}')
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(gulp.dest('img'));
});

gulp.task('symbols', function() {
  return gulp.src('img/sprite/*.svg')
    .pipe(plumber())
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('symbols.svg'))
    .pipe(gulp.dest('img'));
});

gulp.task('build', function(fn) {
  run(
    'clean',
    'copy',
    'js',
    'style',
    'images',
    'symbols',
    'html',
    fn
  );
});

gulp.task('serve', function() {
  server.init({
    server: 'build/.'
  });
  gulp.watch('less/**/*.less', ['style']);
  gulp.watch(['*.html', '_include/*.html'], ['watch:html']);
  gulp.watch(['js/*.js'], ['watch:js']);
  gulp.watch(['img/**'], ['watch:img']);
  gulp.watch(['fonts/**'], ['watch:fonts']);
});

gulp.task('watch:html', ['html'], reload);
gulp.task('watch:js', ['js'], reload);
gulp.task('watch:img', ['copy:img'], reload);
gulp.task('watch:fonts', ['copy:fonts'], reload);

function reload(done) {
  server.reload();
  done();
}
