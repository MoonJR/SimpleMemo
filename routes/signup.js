/**
 * Created by MoonJR on 2016. 1. 11..
 */

var pool = require('../manager/MysqlConnectionPool').mysqlPool;
var flag = require('../manager/ErrorFlag');

exports.signUp = function (req, res, next) {
    try {
        var email = req.query.email;
        var passwd = req.query.passwd;

        if (!email) {
            res.json(flag.FLAG_ERROR_JSON);
            return;
        }

        var id = email.hashCode();
        var regDate = new Date().getTime();

        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                res.json(flag.FLAG_ERROR_JSON);
                connection.release();
            } else {
                connection.query('INSERT INTO USER VALUES(?,?,?,?)', [id, email, passwd, regDate], function (err, result) {
                    if (err) {
                        if (err.code == 'ER_DUP_ENTRY') {
                            res.json(flag.FLAG_SIGNUP_EXIST_EMAIL);
                        } else {
                            console.log(err);
                            res.json(flag.FLAG_ERROR_JSON);
                        }
                    } else {
                        next();
                    }
                    connection.release();
                });
            }
        });
    } catch (e) {
        res.json(flag.FLAG_ERROR_JSON);
    }

};

