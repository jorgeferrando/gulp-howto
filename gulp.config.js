module.exports = (function() {
    'use strict';
    var frontend = './src/frontend/';
    var temp = './.tmp/'
    var config = {
        temp: temp,
        frontend: frontend,
        /**
         * path files
         */
        alljs:[
            frontend + '**/*.js',
            frontend + '**/**/*.js'
        ],
        index: frontend + 'index.html',
        css: temp + 'aaa.css',
        js:[
            frontend + '*.js',
            frontend + '**/*.js',
            '!' + frontend + 'test/*'
        ],

        less: frontend + 'styles/*.less',

        bower: {
            json: require('./bower.json'),
            directory: './bower_components',
            ignorePath:'../..'
        }
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
