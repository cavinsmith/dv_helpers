/**
 * Created by evgeniy on 04.03.16.
 */

class Controller {
    constructor(){
        this.rules = {};
    }

    setApp(app, action, args){
        this.app = app;
        this.action = action;
        this.args = args;
    }

    handle(req,res){
        var action = this[this.action];
        if(action != null){
            this.req = req;
            this.res = res;

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            if(this.app.config.auth_enabled && !this.validateToken()){
                res.sendStatus(401);
                return;
            }

            var validationErrors = this.checkFields();
            if(validationErrors.length > 0){
                this.res.status(422).send({errors: validationErrors});
            }

            action = action.bind(this);
            action();
        }else{
            res.sendStatus(404);
        }
    }

    validateToken() {
        var authHeader = this.req.header('authorization');
        if (authHeader != null) {
            var token = authHeader.split(' ')[1];
            return token == this.app.config.auth_token;
        }
        else
            return false;
    }

    checkFields() {
        if (this.action != null) {
            let actionRules = this.rules[this.action];
            if(actionRules == null){
                return [];
            }
            let required = actionRules['required'];
            let optional = actionRules['optional'];
            let fields = {};
            var errors = [];

            if (this.req.method == 'POST' && actionRules != null) {
                fields = this.req.body;
            }

            if (required != null) {
                var notExistKeys = [];
                required.forEach(function (obj, idx, arr) {
                    if (!(obj in fields) || fields[obj] === '') {
                        notExistKeys.push(obj);
                    }
                });

                if (notExistKeys.length > 0) {
                    errors.push('Required keys: ' + JSON.stringify(notExistKeys));

                    if (optional != null) {
                        var optionalExistKeys = [];
                        optional.forEach(function (obj, idx, arr) {
                            if (!(obj in fields) || fields[obj] === '') {
                                optionalExistKeys.push(obj);
                            }
                        });

                        if (optionalExistKeys.length > 0) {
                            errors.push('Optional keys: ' + JSON.stringify(optionalExistKeys));
                        }
                    }
                }
            }

            return errors;
        }
    }

    error(code){
        var error = this.errors[code];
        this.res.status(error.http).send({errors: [error.message]});
    }
}

module.exports = Controller;