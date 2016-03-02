/**
 * Created by evgeniy on 02.03.16.
 */

require('./lib/index.js');
require('mocha');

describe('instantiate', function() {
    var winstonConfigurator = null;

    var config = {
        logstash_transport:{
            "host":"192.168.10.202",
            "port":28777,
            "node_name":"PMv3 ProcessingApp"
        }
    };

    it('should instantiate WinstonConfigurator', function () {
        winstonConfigurator = new WinstonConfigurator('debug', config.logstash_transport, 'test.log');
    })

    it('should write log message', function () {
        winstonConfigurator.debug('test message');
    })
});
