const mysql = require('mysql');
require('dotenv').config();

module.exports = function () {
    return {
        init: function () {
            return mysql.createConnection({
                host: process.env.MYSQL_HOST,
                port: process.env.MYSQL_PORT,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWD,
                database: process.env.MYSQL_DB,
                multipleStatements: true,
                dateStrings: 'date'
            })
        },
        db_open: function (con) {
            con.connect(function (err) {
                if (err) {
                    console.error('mysql connection error :' + err);
                } else {
                    console.info('mysql is connected successfully.');
                }
            })
        }
    }
};