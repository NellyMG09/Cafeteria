// ------------------------------------------------------
// Gulpfile simple: JPG/PNG -> optimiza, WebP, AVIF
// SVG -> optimiza
// CSS (SCSS -> CSS)
// `gulp` = modo watch (se queda ejecutando)
// ------------------------------------------------------
const { src, dest, watch, series, parallel } = require('gulp');
const sass  = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const through2 = require('through2');
const sharp = require('sharp');

const imagemin = require('gulp-imagemin');
let mozjpeg = require('imagemin-mozjpeg');  mozjpeg = mozjpeg.default || mozjpeg;
let optipng = require('imagemin-optipng');  optipng = optipng.default || optipng;
const svgmin = require('gulp-svgmin');

const IMG_RASTER_GLOB = 'src/img/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}';
const IMG_SVG_GLOB    = 'src/img/**/*.svg';

// ---------- tareas ----------
function css() {
  return src('src/scss/app.scss', { allowEmpty: true })
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(dest('build/css'));
}

// JPG/PNG optimizados -> build/img
function imagenes() {
  return src(IMG_RASTER_GLOB, { allowEmpty: true })
    .pipe(imagemin([
      mozjpeg({ quality: 78, progressive: true }),
      optipng({ optimizationLevel: 5 }),
    ]))
    .pipe(dest('build/img'));
}

// SVG optimizados -> build/img
function svg() {
  return src(IMG_SVG_GLOB, { allowEmpty: true })
    .pipe(svgmin({
      multipass: true,
      plugins: [
        { name: 'removeDimensions', active: false },
        { name: 'removeViewBox', active: false },
      ],
    }))
    .pipe(dest('build/img'));
}

// WebP con sharp (lee desde disco) -> build/img-webp
function versionWebp() {
  return src(IMG_RASTER_GLOB, { allowEmpty: true, buffer: false })
    .pipe(through2.obj(async function (file, _, cb) {
      try {
        const out = await sharp(file.path).webp({ quality: 78 }).toBuffer();
        file.contents = out;
        file.extname = '.webp';
        cb(null, file);
      } catch {
        cb(); // salta archivo si falla
      }
    }))
    .pipe(dest('build/img-webp'));
}

// AVIF con sharp (lee desde disco) -> build/img-avif
function versionAvif() {
  return src(IMG_RASTER_GLOB, { allowEmpty: true, buffer: false })
    .pipe(through2.obj(async function (file, _, cb) {
      try {
        const out = await sharp(file.path)
          .avif({ quality: 62, effort: 4, chromaSubsampling: '4:4:4' })
          .toBuffer();
        file.contents = out;
        file.extname = '.avif';
        cb(null, file);
      } catch {
        cb(); // salta archivo si falla
      }
    }))
    .pipe(dest('build/img-avif'));
}

// Agrupadores
const buildImages = parallel(imagenes, svg, versionWebp, versionAvif);
const buildAll    = series(buildImages, css);

// Watch (queda en ejecución)
function dev() {
  // primera compilación
  buildAll(() => {});
  // observa cambios
  watch('src/scss/**/*.scss', css);
  watch([IMG_RASTER_GLOB, IMG_SVG_GLOB], buildImages);
}

// exports
exports.css = css;
exports.imagenes = imagenes;
exports.svg = svg;
exports.versionWebp = versionWebp;
exports.versionAvif = versionAvif;
exports.build = buildAll;
exports.dev = dev;
exports.default = dev; // ← `gulp` se queda ejecutando
