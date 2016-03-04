/**
 * Created by evgeniy on 02.03.16.
 */

require('./lib/index.js');
require('mocha');
require('should');

describe('Logger', () => {

    var log = null;

    var config = {
        logstash_transport:{
            "host":"192.168.10.202",
            "port":28777,
            "node_name":"PMv3 ProcessingApp"
        }
    };

    it('should instantiate Logger', () => {
        log = new Logger('silly', config.logstash_transport, 'test.log');
    });

    it('should test different log modes', () => {
        log.i('info');
        log.w('warning');
        log.e('error');
    });

    it('should write log message with working mask', () => {
        var result = log.d('test message with insecure pan 5522045000047384');
        result.should.equal('test message with insecure pan 552204******7384               ');

        result = log.d('test message with insecure track2 1234567890123445=99011200123400000000');
        result.should.equal('test message with insecure track2 123456******3445=990112******00000000               ');
    });

    it('should test winstonStream for express logging', () => {
        log.winstonStream.write('test winstonStream for express\n', 'utf-8');
    });

    it('should test static accesibility', () => {
        var localLogger = Logger.getInstance();
        localLogger.d('static debug');
    });
});

describe('App', () =>
{
   it('should instantiate App', () => {
      var app = new App();
   });
});


describe('BaseHttpClient', () => {
    var client_api = {
            https: false,
            host: "api.pay-me.docker",
            port: 8080,
            path: "/v3/",
            token: "97998de44a6716ed267ddfe8811ea0410c548aa1d221bc0b29b5f88582e571de"
    };

    var extApi;

    it('should instantiate BaseHttpClient', () => {
        extApi = new ExternalApiClient(client_api);
    });

    it('should make get request with error', done => {
        extApi.get('user/1', result => {
            result.should.be.Error();
            done();
        });
    });

    it('should make success get request', done => {
        extApi.get('user/79060954555', result => {
            result.should.not.be.Error();
            done();
        })
    })
});