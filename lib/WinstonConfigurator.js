var fs = require('fs');
var winston = require('winston');
require('winston-logstash');

class WinstonConfigurator {
    constructor(log_level, logstash_transport, file_transport){
        var dateFunc = function() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).substr(-2) + '-' + ('0' + d.getDate()).substr(-2) + ' ' + ('0' + d.getHours()).substr(-2) + ':' + ('0' + d.getMinutes()).substr(-2) + ':' + ('0' + d.getSeconds()).substr(-2)};

        var transports = [];

        logstash_transport.timestamp = dateFunc;

        var consoleTransport = new (winston.transports.Console)({timestamp: dateFunc});
        var fileTransport = new (winston.transports.File)({ filename: file_transport, timestamp:dateFunc, json: false});

        transports.push(consoleTransport);
        transports.push(fileTransport);

        var logstashTransport = new (winston.transports.Logstash)(logstash_transport);
        logstashTransport.on('error', function (error) {
            winston.debug('Winston Logstash error:');
            winston.debug(error);
        });
        transports.push(logstashTransport);

        winston = new (winston.Logger)({
            transports: transports,
            level: log_level
        });

        this.reopenTransportOnHupSignal(fileTransport);

        process.on('uncaughtException', function (err) {
            winston.error(err.stack);
            setTimeout(function () {
                process.exit(1);
            },1000);
        });

        this.winstonStream = {
            write: function(message, encoding){
                if(message.indexOf('error') != -1 && message.indexOf('404') != -1){
                    return;
                }
                message = message.substr(0,message.length-1);
                winston.debug(maskSecureData(message) + '               ');
            }
        };
    }

    reopenTransportOnHupSignal(fileTransport) {
        process.on('SIGHUP', function() {
            var fullname = file_transport;

            function reopen() {
                if (fileTransport._stream) {
                    fileTransport._stream.end();
                    fileTransport._stream.destroySoon();
                }

                var stream = fs.createWriteStream(fullname, fileTransport.options);
                stream.setMaxListeners(Infinity);

                fileTransport._size = 0;
                fileTransport._stream = stream;

                fileTransport.once('flush', function () {
                    fileTransport.opening = false;
                    fileTransport.emit('open', fullname);
                });

                fileTransport.flush();
            }

            //fs.stat(fullname, function (err) {
            //    if (err && err.code == 'ENOENT') {
            return reopen();
            //    }
            //});
        });
    }

    maskSecureData(msg){
        if(msg.length > 1000){
            msg = msg.substr(0, 1000) + '...';
        }
        var regexp = /(.*)(\d{6})(\d{4})\=(\d{4})(.*)/gm;
        var panPart = '';
        msg = msg.replace(regexp, function (complete, a, b, c, d, f) {
            panPart = b;
            return a + new Array(b.length + 1).join("*") + c + '=' + d + f;
        });

        var regexp = /(\.\.)(\d{16,18})/gm;
        msg = msg.replace(regexp, function (complete, a,b) {
            return a + new Array(b.length + 1).join("*");
        });

        var regexp = /(\d{6})(\d{6})(\d{4})/gm;
        msg = msg.replace(regexp, function (complete, a, b, c) {
            return a + new Array(b.length + 1).join("*") + c;
        });
        return msg;
    }

    debug(msg){
        msg = JSON.stringify(msg);
        winston.debug(this.maskSecureData(msg) + '               ');
    };
};

global.WinstonConfigurator = WinstonConfigurator;