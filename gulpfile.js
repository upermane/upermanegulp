// Определяем переменную preprocessor
let preprocessor = 'scss'; // Выбор препроцессора в проекте - sass или less

// Определяем константы Gulp
const { src, dest, parallel, series, watch } = require('gulp');

// Подключам Browser-sync
const browserSync = require('browser-sync').create();

// Подключаем gulp-concat
const concat = require('gulp-concat');

// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;

// Подключаем модули gulp-sass и gulp-less
const sass = require('gulp-sass')(require('sass'));
const less = require('gulp-less');
const scss = require('gulp-sass')(require('sass'));

// Подключаем Autoprefixer
const autoprefixer = require('gulp-autoprefixer');

// Подключаем модуль gulp-clean-css
const cleancss = require('gulp-clean-css');

// Подключаем модуль gulp-imagemin для работы с изображениями
const imagemin = require('gulp-imagemin');

// Подключаем модуль gulp-newer
const newer = require('gulp-newer');

// Подключаем модуль del
const del = require('del');

// Определяем логику работы Browser-sync
function browsersync() {
    browserSync.init({ //Инилициализация Browsersync
        server: { baseDir: 'app/' }, //указываем папку сервера
        notify: false, // Отключаем уведомления
        online: true // Режим работы True or False. Параметр online отвечает за режим работы. Укажите online: false, если хотите работать без подключения к интернету.
    })
}

function scripts() { // Создаем функцию scripts()
    return src([ // Берем файл из источников
            'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
            'app/js/app.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце 
        ])
        .pipe(concat('app,min,js')) // Контатенируем в один файл
        .pipe(uglify()) // Сжимаем JavaScript
        .pipe(dest('app/js/')) // Выгружаем готовый файл в папку назначения
        .pipe(browserSync.stream()) //Триггерим Browser-sync для обновления страницы
}

function startwatch() {
    // Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
    watch(['app/**/*.js', '!app/**/*.min.js'], scripts);

    // Мониторим файлы препроцессора на изменения
    watch('app/**/' + preprocessor + '/**/*', styles);

    // Мониторим файлы HTML на изменения
    watch('app/**/.html').on('change', browserSync.reload);

    // Мониторим папку-источник изображений и выполняем images(), если есть изменения
    watch('app/images/src/**/*', images);
}

function styles() {
    return src([
            'node_modules/normalize.css/normalize.css',
            'app/' + preprocessor + '/main.' + preprocessor + ''
        ]) // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
        .pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
        .pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Создадим префиксы с помощью Autoprefixer
        .pipe(cleancss({ level: { 1: { specialComments: 0 } } /* , format: 'beautify' */ })) // Минифицируем стили
        .pipe(dest('app/css/')) // Выгрузим результат в папку "app/css/"
        .pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}

function images() {
    return src('app/images/src/**/*') // Берем все изображения из папки источника
        .pipe(newer('app/images/dest/')) // Проверяем, было ли изменено (сжато) изображение ранее
        .pipe(imagemin()) // Сжимаем и оптимизируем изображеня
        .pipe(dest('app/images/dest/')) // Выгружаем оптимизированные изображения в папку назначения
}

function cleanimg() {
    return del('app/images/dest/**/*', { force: true }) // Удаляем все содержимое папки "app/images/dest/"
}

function cleanscss() {
    return del('app/css/**/*', { force: true }) // Удаляем все содержимое папки "app/css/"
}

function buildcopy() {
    return src([ // Выбираем нужные файлы
            'app/css/**/*.min.css',
            'app/js/**/*.min.js',
            'app/images/dest/**/*',
            'app/**/*.html',
        ], { base: 'app' }) // Параметр "base" сохраняет структуру проекта при копировании
        .pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
}

function cleandist() {
    return del('dist/**/*', { force: true }) // Удаляем все содержимое папки "dist/"
}

//Экспортируем функцию browsersync() как таск browsync. Это значение после знака = это имеющаюся функция.
exports.browsersync = browsersync;

// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;

// Экспортируем функцию styles() в таск styles
exports.styles = styles;

//Экспорт функции images() в таск images
exports.images = images;

// Экспортируем функцию cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;

// Экспортируем функцию cleanscss() как таск cleanscss
exports.cleanscss = cleanscss;

// Создаем новый таск "build", который последовательно выполняет нужные операции
exports.build = series(cleandist, styles, scripts, images, buildcopy);

// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(styles, scripts, browsersync, startwatch);
// Дефолтный таск exports.default позволяет запускать проект одной командой gulp в терминале.
// parallel() - параллельное выполнение всех перечисленных в скобках функций. В нашем случае, параллельно будут собраны скрипты (scripts), запущен сервер (browsersync) и запущен вотчер (startwatch).