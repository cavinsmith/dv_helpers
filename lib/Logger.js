var fs = require('fs');
var winston = require('winston');
require('winston-logstash');

class WinstonStream {
    constructor(winstonConfigurator){
        this.wc = winstonConfigurator;
    }

    write(message, encoding){
        if(message.indexOf('error') != -1 && message.indexOf('404') != -1){
            return;
        }
        message = message.substr(0,message.length-1);
        winston.debug(this.wc.maskSecureData(message) + '               ');
    }
}

var instance;

class Logger {

    static getInstance(){
        return instance;
    }

    constructor(log_level, logstash_transport, file_transport){
        instance = this;
        this.file_transport = file_transport;

        var dateFunc = function() {
            var d = new Date();
            return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).substr(-2) + '-' + ('0' + d.getDate()).substr(-2) + ' ' + ('0' + d.getHours()).substr(-2) + ':' + ('0' + d.getMinutes()).substr(-2) + ':' + ('0' + d.getSeconds()).substr(-2)
        };

        var transports = [];
        this.consoleTransport = new (winston.transports.Console)({timestamp: dateFunc, colorize: true});
        transports.push(this.consoleTransport);

        if(logstash_transport != null){
            logstash_transport.timestamp = dateFunc;
            this.logstashTransport = new (winston.transports.Logstash)(logstash_transport);
            this.logstashTransport.on('error', function (error) {
                winston.debug('Winston Logstash error:');
                winston.debug(error);
            });
            transports.push(this.logstashTransport);
        }

        if(file_transport != null){
            this.fileTransport = new (winston.transports.File)({ filename: file_transport, timestamp:dateFunc, json: false});
            transports.push(this.fileTransport);
        }

        winston = new (winston.Logger)({
            transports: transports,
            level: log_level
        });

        this.reopenTransportOnHupSignal();

        process.on('uncaughtException', function (err) {
            winston.error(err.stack);
            setTimeout(function () {
                process.exit(1);
            },1000);
        });

        this.winstonStream = new WinstonStream(this);
    }

    reopenTransportOnHupSignal() {
        process.on('SIGHUP', this.handleSIGHUP);
    }

    handleSIGHUP(){
        var fullname = this.file_transport;

        function reopen() {
            if (this.fileTransport._stream) {
                this.fileTransport._stream.end();
                this.fileTransport._stream.destroySoon();
            }

            var stream = fs.createWriteStream(fullname, this.fileTransport.options);
            stream.setMaxListeners(Infinity);

            this.fileTransport._size = 0;
            this.fileTransport._stream = stream;

            this.fileTransport.once('flush', () => {
                this.fileTransport.opening = false;
                this.fileTransport.emit('open', fullname);
            });

            this.fileTransport.flush();
        }

        return reopen();
    }

    maskSecureData(msg){
        if(msg.length > 1000){
            msg = msg.substr(0, 1000) + '...';
        }
        var regexp = /(.*)(\d{6})(\d{4})=(\d{4})(.*)/gm;
        var panPart = '';
        msg = msg.replace(regexp, function (complete, a, b, c, d, f) {
            panPart = b;
            return a + new Array(b.length + 1).join("*") + c + '=' + d + f;
        });

        regexp = /(\.\.)(\d{16,18})/gm;
        msg = msg.replace(regexp, function (complete, a,b) {
            return a + new Array(b.length + 1).join("*");
        });

        regexp = /(\d{6})(\d{6})(\d{4})/gm;
        msg = msg.replace(regexp, function (complete, a, b, c) {
            return a + new Array(b.length + 1).join("*") + c;
        });
        return msg;
    }

    prepareMessage(msg){
        if(msg instanceof Object){
            msg = JSON.stringify(msg);
            msg = msg.replace('\\','');
        }
        msg = this.maskSecureData(msg) + '               ';
        return msg;
    }

    d(msg){
        msg = this.prepareMessage(msg);
        winston.log('debug', msg);
        return msg;
    };

    i(msg){
        msg = this.prepareMessage(msg);
        winston.log('info', msg);
        return msg;
    }

    w(msg){
        msg = this.prepareMessage(msg);
        winston.log('warn', msg);
        return msg;
    }

    e(msg){
        msg = this.prepareMessage(msg);
        winston.log('error', msg);
        return msg;
    }
}

global.Logger = Logger;