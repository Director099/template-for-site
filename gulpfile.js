'use strict';

var dirs = require('./package.json').config;

const gulp = require('gulp');
const { series, parallel } = gulp;
const buffer = require('vinyl-buffer');
const pug = require('gulp-pug');
const sass = require('gulp-sass'); //препроцессор sass
const plumber = require('gulp-plumber'); //плагин чтоб не слетело во время ошибок
const postcss = require('gulp-postcss'); // плагин для автопрефикса, минифик
const autoprefixer = require('autoprefixer'); // автопрефикс для браузеров
const server = require('browser-sync').create(); //автоперазгрузки браузера
const mqpacker = require('css-mqpacker'); //обьединение медиавыражения, объединяем «одинаковые селекторы» в одно правило
const minify = require('gulp-csso'); //минификация css
const rename = require('gulp-rename'); // перемейноввывние имя css
const imagemin = require('gulp-imagemin'); // ужимаем изображение
const svgstore = require('gulp-svgstore'); // собиральщик cvg
const svgmin = require('gulp-svgmin'); // свг минификация
//var run = require('run-sequence'); //запуск плагинов очередью
const del = require('del'); //удаление ненужных файлов
//var concat = require('gulp-concat'); // Конкатинация
const uglify = require('gulp-uglify'); // минификация js
// pug
const atImport = require('postcss-import'); // Импорт стороним плагином чтоб избежать ошибки
const csscomb = require('gulp-csscomb'); // Красота Css
const prettify = require('gulp-prettify'); // Красота HTML
const tinify = require('gulp-tinypng'); // Сжатие изображения
const rollup = require('gulp-better-rollup');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

const clean = () => {
  return del(dirs.build);
}

const copy = () => {
  return gulp.src([
    dirs.source + '/fonts/**',
    dirs.source + '/video/**',
    dirs.source + '/libs/**',
    './robots.txt'
  ], {
    base: './src/'
  })
    .pipe(gulp.dest(dirs.build));
}

const style = (done) => {
  gulp.src(dirs.source + '/sass/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer({
        browsers: [
          'last 1 versions'
        ]
      }),
      mqpacker({
        sort: true
      }),
      atImport()
    ]))
    .pipe(csscomb())
    .pipe(gulp.dest(dirs.build + '/css'))
    .pipe(minify())
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest(dirs.build + '/css'))
    .pipe(server.stream());

  done();
}

const pug2html = () => {
  return gulp.src(dirs.source + '/*.pug')
    .pipe(plumber())
    .pipe(pug())
    .pipe(prettify({
      indent_size: 2,
      indent_char: ' ',
      inline: [], // перенос строки для всех инлайн элементов
      end_with_newline: true // перенос строки в конце файла
    }))
    .pipe(gulp.dest(dirs.build))
    .pipe(server.stream());
}

const scripts = () => {
  return gulp.src(dirs.source + '/js/*.js')
    .pipe(rollup({ plugins: [babel(), resolve(), commonjs()] }, 'umd'))
    .pipe(plumber())
    .pipe(gulp.dest(dirs.build + '/js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(dirs.build + '/js'));
}

const images = () => {
  return gulp.src(`${dirs.source}/img/**/*.{png,jpg,gif,webp,svg,cur,ico}`)
    .pipe(buffer())
    .pipe(imagemin([
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.jpegtran({ progressive: true })
    ]))
    .pipe(gulp.dest(dirs.build + '/img'));
}

const symbols = () => {
  return gulp.src(dirs.source + '/img/sprite/*.svg')
    .pipe(plumber())
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('symbols.svg'))
    .pipe(gulp.dest(dirs.build + '/img'));
}

const serve = (cb) => {
  server.init({
    server: dirs.build,
    notify: false,
    open: true,
    cors: true,
    startPath: 'index.html'
  });

  gulp.watch(`${dirs.source}/img/*/*.{png,jpg,gif,webp,svg,cur,ico}`, series(images)).on('change', server.reload);
  gulp.watch(`${dirs.source}/img/sprite/*.svg`, series(symbols)).on('change', server.reload);
  gulp.watch(['src/blocks/**/**/*.scss', 'src/sass/**/*.scss'], series(style)).on('change', server.reload);
  gulp.watch([`${dirs.source}/js/*.js`, `${dirs.source}/blocks/**/**/*.js`], series(scripts)).on('change', server.reload);
  gulp.watch(['src/fonts/**', 'src/video/**', 'src/libs/**'], series(copy)).on('change', server.reload);
  gulp.watch(`${dirs.source}/**/*.pug`, series(pug2html)).on('change', server.reload);

  return cb();
}

exports.dev = series(
  clean,
  parallel(pug2html, style, scripts, images, symbols, copy),
  serve
)

exports.deploy = series(
  clean,
  parallel(pug2html, style, scripts, images, symbols, copy)
)
