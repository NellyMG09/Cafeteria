const { src, dest, watch } = require('gulp'); //Con llaves exporta varias funciones
const sass  = require('gulp-sass')(require('sass')); //Sin llave exporta una función 

function css( done ) {
    //compilar sass
    //Paso 1 - Identificar hoja de archivo, 2 - Compilarla, 3 - Guardar el .css

    src('src/scss/app.scss')
    .pipe( sass({ outputStyle: 'compressed'}) )
    .pipe( dest('build/css') )

    done();

}

function dev() {
    watch('src/scss/app.scss', css);
}

exports.css = css;
exports.dev = dev;