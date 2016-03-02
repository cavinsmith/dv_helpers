/**
 * Created by evgeniy on 02.04.15.
 */

var http = require('http');

var ExternalApiClient = function (config, winston) {

    var https_enabled = config.https;
    var token = config.token;
    var host = config.host;
    var port = config.port;
    var path = config.path;

    if(https_enabled) {
        http = require('https');
    }else
    {
        http = require('http');
    }

    this.post = function(method, data, resultFunc)
    {
        var data = new Buffer(JSON.stringify(data), 'utf8');

        if(winston){
            winston.debug('Sending packet: ' + data);
        }

        var options = {
            path: ((https_enabled) ? 'https' : 'http') + '://' + host + ':' + port + path + method,
            method: 'POST',
            headers:
            {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        if(config.proxy != null){
            options.hostname = config.proxy.host;
            options.port = config.proxy.port;
        }else{
            options.hostname = config.host;
            options.port = config.port;
        }

        var req = http.request(options, function(res)
        {
            onResponse(res, resultFunc);
        });
        req.on('error', function (err) {
            onResponse(null, resultFunc);
        });
        req.write(data);
        req.end();
    };

    this.put = function (method, data, resultFunc) {
        var options = {
            path: ((https_enabled) ? 'https' : 'http') + '://' + host + ':' + port + path + method,
            method: 'PUT',
            headers:
            {
                Authorization: 'Bearer ' + token,
                'Content-Length': data.length
            }
        };

        if(config.proxy != null){
            options.hostname = config.proxy.host;
            options.port = config.proxy.port;
        }else{
            options.hostname = config.host;
            options.port = config.port;
        }

        var req = http.request(options, function (res) {
            onResponse(res, resultFunc);
        });

        req.on('error', function (err) {
            onResponse(null, resultFunc);
        });

        req.write(data);
        req.end();
    };

    this.get = function(method, resultFunc)
    {
        var options = {
            path: ((https_enabled) ? 'https' : 'http') + '://' + host + ':' + port + path + method,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token }
        };

        if(config.proxy != null){
            options.hostname = config.proxy.host;
            options.port = config.proxy.port;
        }else{
            options.hostname = config.host;
            options.port = config.port;
        }

        var req = http.request(options, function(res)
        {
            onResponse(res, resultFunc);
        });
        req.on('error', function (err) {
            onResponse(null, resultFunc);
        });
        req.end();
    };

    function onResponse(res, resultFunc)
    {
        if(res != null)
        {
            var data = '';
            res.on('data', function (d) {
                data += d;
            });
            res.on('end', function() {
                if(winston){
                    winston.debug('Received packet: ' + JSON.stringify(data));
                }

                var obj = null;
                try
                {
                    obj = JSON.parse(data.toString('utf8'));
                }
                catch (e)
                {
                    if(winston) {
                        winston.debug(e);
                        winston.debug('no json packet');
                    }
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
            if(winston){
                winston.debug('WARN: external api error');
            }
            resultFunc(null);
        }
    }
};

module.exports = ExternalApiClient;