/**
 * Created by evgeniy on 09.03.16.
 */

    require('./App');
var Sequelize = require('sequelize');

class BaseModel {
    constructor(){
        this.model = null;
        this.app = App.getInstance();
        let db = this.app.config.db;
        let dbConnString = `postgres://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}?searchPath=${db.searchPath}`;
        this.sequelize = new Sequelize(dbConnString, {
            logging: str => {
                Logger.getInstance().i(str);
            }
        });
    }
}

global.BaseModel = BaseModel;
global.Sequelize = Sequelize;