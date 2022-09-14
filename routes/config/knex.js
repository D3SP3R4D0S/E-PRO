require('dotenv').config();
const knex = require('knex')({
    client: 'mysql',
    connection: {
        host     : process.env.MYSQL_HOST,
        port     : process.env.MYSQL_PORT,
        user     : process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWD,
        database: process.env.MYSQL_DB,
        multipleStatements: true,
        dateStrings: 'date',
        pool:{
            min: 0,
            max: 10
        }
    }
});
module.exports = knex;