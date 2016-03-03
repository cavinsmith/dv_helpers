/**
 * Created by evgeniy on 02.04.15.
 */

var http = require('http');
require('./Logger');

class BaseHttpClient {

    constructor(config){
        this.https_enabled = config.https;
        this.token = config.token;
        this.host = config.host;
        this.port = config.port;
        this.path = config.path;
        this.proxy = config.proxy;
        this.log = Logger.getInstance();

        if(this.https_enabled) {
            http = require('https');
        }else
        {
            http = require('http');
        }
    }

    post(method, data, resultFunc) {
        data = new Buffer(JSON.stringify(data), 'utf8');

        this.log.d('Sending packet: ' + data);

        var options = {
            path: ((this.https_enabled) ? 'https' : 'http') + '://' + this.host + ':' + port + this.path + method,
            method: 'POST',
            headers:
            {
                Authorization: 'Bearer ' + this.token,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        if(this.proxy != null){
            options.hostname = this.proxy.host;
            options.port = this.proxy.port;
        }else{
            options.hostname = this.config.host;
            options.port = this.config.port;
        }

        var req = http.request(options, function(res)
        {
            this.onResponse(res, resultFunc);
        });
        req.on('error', function (err) {
            this.onResponse(null, resultFunc);
        });
        req.write(data);
        req.end();
    }

    put(method, data, resultFunc) {
        var options = {
            path: ((this.https_enabled) ? 'https' : 'http') + '://' + this.host + ':' + this.port + this.path + method,
            method: 'PUT',
            headers:
            {
                Authorization: 'Bearer ' + this.token,
                'Content-Length': data.length
            }
        };

        if(this.proxy != null){
            options.hostname = this.proxy.host;
            options.port = this.proxy.port;
        }else{
            options.hostname = this.host;
            options.port = this.port;
        }

        var req = http.request(options, function (res) {
            this.onResponse(res, resultFunc);
        });

        req.on('error', function (err) {
            this.onResponse(null, resultFunc);
        });

        req.write(data);
        req.end();
    };

    get(method, resultFunc) {
        var options = {
            path: ((this.https_enabled) ? 'https' : 'http') + '://' + this.host + ':' + this.port + this.path + method,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + this.token }
        };

        if(this.proxy != null){
            options.hostname = this.proxy.host;
            options.port = this.proxy.port;
        }else{
            options.hostname = this.host;
            options.port = this.port;
        }

        var req = http.request(options, res => {
            this.onResponse(res, resultFunc);
        });
        req.on('error', err => {
            this.onResponse(null, resultFunc);
        });
        req.end();
    };

    onResponse(res, resultFunc) {
        if(res != null)
        {
            var data = '';
            res.on('data', function (d) {
                data += d;
            });
            res.on('end', () => {
                this.log.d('Received packet: ');
                this.log.d(data);

                var obj = null;
                try
                {
                    obj = JSON.parse(data.toString('utf8'));
                }
                catch (e)
                {
                    this.log.d(e);
                    this.log.d('No JSON packet received');
                }
                if(res.statusCode == 200){
                    resultFunc(obj);
                }
                else{
                    if(obj != null){
                        if(resultFunc != null){
                            resultFunc(new Error(data));
                        }
                    }else{
                        if(resultFunc != null){
                            resultFunc(null);
                        }
                    }
                }
            });
        }
        else{
            this.log.d(this.constructor.name + 'WARN: external api error');
            resultFunc(null);
        }
    }
};

global.ExternalApiClient = BaseHttpClient;