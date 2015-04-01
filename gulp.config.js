module.exports = (function() {
    'use strict';
    var frontend = './src/frontend/';
    var temp = './.tmp/';
    var server = './src/server/';
    var build = './build/';

    var config = {
        /**
         * path files
         */
        alljs:[
            frontend + '**/*.js',
            frontend + '**/**/*.js'
        ],
        index: frontend + 'index.html',
        html: frontend + '**/*.html',
        css: temp + 'style.css',
        js:[
            frontend + '*.js',
            frontend + '**/*.js',
            '!' + frontend + 'test/*'
        ],
        less: frontend + 'styles/*.less',
        temp: temp,
        frontend: frontend,
        server: server,
        build: build,
        images:frontend + 'images/**/*.*',
        fonts:'./bower_components/font-awesome/fonts/**/*.*',
        htmlTemplates: frontend + '**/*.html',

        templateCache: {
            file: 'templates.js',
            options: {
                module: 'app.core',
                standAlone: false,
                root: 'app/'
            }
        },

        /**
         * browser sync
         */
        browserReloadDelay:1000,

        /**
         * Bower and NPM locations
         */
        bower: {
            json: require('./bower.json'),
            directory: './bower_components',
            ignorePath:'../..'
        },

        /**
         * Node Settings
         */
        defaultPort: 8080,
        nodeServer: server + 'app.js'
    };

    config.getWiredepDefaultOptions = function () {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };
        return options;
    };

    return config;
})();
