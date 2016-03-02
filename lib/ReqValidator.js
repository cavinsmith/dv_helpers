/**
 * Created by evgeniy on 31.03.15.
 */
function ReqValidator(cors_enabled, auth_enabled, auth_token) {
    this.cors_enabled = cors_enabled;
    this.auth_enabled = auth_enabled;
    this.auth_token = auth_token;
}

ReqValidator.prototype = {
    isValidRequest: function(req, requiredKeys){
        var notExistKeys = [];
        requiredKeys.forEach(function(obj,idx,arr) {
            if(!(obj in req) || req[obj] === '') {
                notExistKeys.push(obj);
            }
        });

        return notExistKeys;
    },

    validateToken: function(req, apiToken)
    {
        var authHeader = req.header('authorization');
        if(authHeader != null)
        {
            var token =authHeader.split(' ')[1];
            return token == apiToken;
        }
        else
            return false;
    },

    throwException: function(res, code, message)
    {
        res.status(422).send({code: code, message: message});
    },

    checkAuthorization: function(req, res, next)
    {
        if(this.cors_enabled){
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        }
        if(this.auth_enabled){
            if(this.validateToken(req, this.auth_token)){
                next();
            }else{
                res.sendStatus(401);
            }
        }
        else
            next();
    },

    checkFields: function(req)
    {
        if((req.method == 'POST' && req.requiredFields != null) || (req.method == 'GET' && req.requiredFields != null))
        {
            var fields = null;
            if(req.method == 'GET')
                fields = req.fields;
            else
                fields = req.body;
            var notExistKeys = this.isValidRequest(fields, req.requiredFields);
            if (notExistKeys.length > 0){
                return 'Required keys: ' + JSON.stringify(notExistKeys) + ((req.optionalFields != null) ? ' Optional fields: ' + JSON.stringify(req.optionalFields) : '');
            }
            else{
                return null;
            }
        }
        else
            return null;
    }
};

module.exports = ReqValidator;

