/**
 * Created by evgeniy on 02.04.15.
 */

var config = require('config');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
require('./Logger');

var instance;

class App {
    constructor() {

        this.config = config.get('config');
        this.log = new Logger('debug', this.config.logstash_transport, this.config.logs_dir);

        this.app = express();
        this.app.use(logger('dev', {stream: this.log.winstonStream}));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: false}));

        this.app.config = this.config.app;

        this.controllers = [];

        this.app.use((req, res, next)=> {
            let path = req.url.split('/');

            let route = path[0];
            let action = path[1];
            let args = path.slice(2, path.length);

            var controller = Object.create(this.controllers[route]);
            controller.setApp(this, action, args);
            controller.handle(req, res, next);
        });
    }

    static getInstance() {
        return instance;
    }

    run() {
        var listen_port = this.config.listen_port;
        this.app.listen(listen_port);
        this.log.i(this.constructor.name + ' started at ' + listen_port + '!');
    }
}

global.App = App;