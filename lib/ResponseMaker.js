var ResponseMaker = function(errors, winston, merge)
{
    this.sendResult = function(res, code, message)
    {
        try
        {
            error = errors[code];
            var result = {code: code, message: error.message};
            if(message != null){
                result = merge.recursive(true, result, message);
            }
            winston.debug('Sending: ' + JSON.stringify(result));
            res.status(error.http).send(result);
        }
        catch (e)
        {
            winston.debug('sendResult:');
            winston.debug(e);
        }
    }
}

module.exports = ResponseMaker;