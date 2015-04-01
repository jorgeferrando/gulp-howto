(function () {
    'use strict';

    var gulp = require('gulp');
    var args = require('yargs').argv;
    var browserSync = require('browser-sync');
    var config = require('./gulp.config');
    var del = require('del');
    var $ = require('gulp-load-plugins')({lazy: true});
    var port = process.env.PORT || config.defaultPort;

    gulp.task('help', $.taskListing);
    gulp.task('default', ['help']);

    gulp.task('vet', function () {
        log('Analyzing source with JSHint and JSCS');
        return gulp
            .src(config.alljs)
            .pipe($.if(args.verbose, $.print()))
            .pipe($.jscs())
            .pipe($.jshint())
            .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
            .pipe($.jshint.reporter('fail'));
    });

    gulp.task('style', ['clean-style'], function () {
        log('Compiling less --> CSS');
        return gulp
            .src(config.less)
            .pipe($.plumber())
            .pipe($.less())
            .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
            .pipe(gulp.dest(config.temp));
    });

    gulp.task('fonts', ['clean-fonts'], function() {
        log('Copying fonts');
        return gulp.src(config.fonts)
            .pipe(gulp.dest(config.build + 'fonts'));
    });

    gulp.task('images', ['clean-images'], function() {
        console.log('Copying images and compressing');
        return gulp.src(config.images)
            .pipe($.imagemin({optimizationLevel:4}))
            .pipe(gulp.dest(config.build + 'images'));
    });

    gulp.task('clean', function(done) {
        var delconfig = [].concat(config.build, config.temp);
        log('Cleaning: ' + $.util.colors.blue(delconfig));
        del(delconfig, done);
    });

    gulp.task('clean-style', function (done) {
        var files = config.temp + '**/*.css';
        clean(files, done);
    });

    gulp.task('clean-fonts', function (done) {
        var files = config.build + 'fonts/**/*.*';
        clean(files, done);
    });

    gulp.task('clean-images', function (done) {
        var files = config.build + 'images/**/*.*';
        clean(files, done);
    });

    gulp.task('clean-code', function (done) {
        var files = [].concat(
            config.temp + '**/*.js',
            config.build + '**/*.html',
            config.build + 'js/**/*.js'
        );
        clean(files, done);
    });

    gulp.task('templatecache', ['clean-code'], function() {
        log('Creating AngularJS $templateCache');
        return gulp
            .src(config.htmlTemplates)
            .pipe($.minifyHtml({empty:true}))
            .pipe($.angularTemplatecache(
                config.templateCache.file,
                config.templateCache.options
            ))
            .pipe(gulp.dest(config.temp));
    });

    gulp.task('less-watcher', function () {
        gulp.watch([config.less], ['styles']);
    });

    gulp.task('wiredep', function () {
        log('Wire up the bower css js and our app js into the html');
        var options = config.getWiredepDefaultOptions();
        var wiredep = require('wiredep').stream;

        return gulp
            .src(config.index)
            .pipe(wiredep(options))
            .pipe($.inject(gulp.src(config.js)))
            .pipe(gulp.dest(config.frontend));
    });

    gulp.task('inject', ['wiredep', 'style', 'templatecache'], function () {
        log('wire up the app css into the html, and call wiredep');
        return gulp
            .src(config.index)
            .pipe($.inject(gulp.src(config.css)))
            .pipe(gulp.dest(config.frontend));
    });

    gulp.task('optimize', ['inject'], function () {
        log('Optimizing the javascript');
        var templateCache = config.temp + config.templateCache.file;
        var assets = $.useref.assets({searchPaths:'./'});
        var cssFilter = $.filter('**/*.css');
        var jsFilter = $.filter('**/*.js');
        return gulp
            .src(config.index)
            .pipe($.plumber())
            .pipe($.inject(gulp.src(templateCache, {read:false}, {
                starttag:'<!-- inject:templates:js -->'
            })))
            .pipe(assets)
            .pipe(cssFilter)
            .pipe($.csso())
            .pipe(cssFilter.restore())
            .pipe(jsFilter)
            .pipe($.uglify())
            .pipe(jsFilter.restore())
            .pipe(assets.restore())
            .pipe($.useref())
            .pipe(gulp.dest(config.build));
    });

    gulp.task('serv-build', ['optimize'], function() {
        serve(false);
    });

    gulp.task('serv-dev', ['inject'], function () {
        serve(true);
    });

    function serve(isDev) {
        var nodeOptions = {
            script: config.nodeServer,
            delayTime: 1,
            env: {
                'PORT': port,
                'NODE_ENV': isDev ? 'dev' : 'build'
            },
            watch: [config.server]
        };

        return $.nodemon(nodeOptions)
            .on('restart', function (ev) {
                log('*** nodemon restarted');
                log('files changed on restart:\n' + ev);
                setTimeout(function () {
                    browserSync.notify('reloading now...');
                    browserSync.reload({stream: false});
                }, config.browserReloadDelay);
            })
            .on('start', function () {
                log('*** nodemon started');
                startBrowserSync(isDev);
            })
            .on('crash', function () {
                log('*** nodemon crashed:');
            })
            .on('exit', function () {
                log('*** nodemon exit cleanly');
            });
    }

    function changeEvent(event) {
        var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
        log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
    }

    function startBrowserSync(isDev) {
        if (args.nosync || browserSync.active) {
            return;
        }
        log('Starting browser-sync on port' + port);

        if (isDev) {
            gulp.watch([config.less], ['styles'])
                .on('change', function (event) {
                    changeEvent(event);
                });
        } else {
            gulp.watch([config.less, config.js, config.html], ['optimize', browserSync.reload])
                .on('change', function (event) {
                    changeEvent(event);
                });
        }
        var options = {
            proxy: 'localhost:' + port,
            port: port,
            files: isDev ? [
                config.frontend + '**/*',
                '!' + config.less,
                config.temp + '**/*.css'
            ] : [],
            ghostMode: {
                clicks: true,
                location: false,
                forms: true,
                scroll: true
            },
            injectChanges: true,
            logFileChanges: true,
            logLevel: 'debug',
            logPrefix: 'gulp-patterns',
            notifiy: true,
            reloadDelay: 1000
        };

        browserSync(options);
    }

    function clean(path, done) {
        log('Cleaning:' + $.util.colors.blue(path));
        del(path, done);
    }

    function log(msg) {
        if (typeof(msg) === 'object') {
            for (var item in msg) {
                if (msg.hasOwnProperty(item)) {
                    $.util.log($.util.colors.blue(item + ': ' + msg[item]));
                }
            }
        } else {
            $.util.log($.util.colors.blue(msg));
        }

    }
})();
