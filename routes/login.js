/**
 * Created by MoonJR on 2016. 1. 11..
 */

var pool = require('../manager/MysqlConnectionPool').mysqlPool;
var flag = require('../manager/ErrorFlag');
var https = require('https');

exports.login = function (req, res) {
    try {
        var email = req.query.email;
        var passwd = req.query.passwd;
        if (!email) {
            res.json(flag.FLAG_ERROR_JSON);
            return;
        }
        var user_id = email.hashCode();

        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                res.json(flag.FLAG_ERROR_JSON);
                connection.release();
            } else {
                connection.query('SELECT REG_DATE FROM USER WHERE USER_ID = ? AND USER_PASSWD = ?', [user_id, passwd], function (err, result) {
                    if (err) {
                        console.log(err);
                        res.json(flag.FLAG_ERROR_JSON);
                    } else {
                        if (result.length == 0) {
                            res.json(flag.FLAG_LOGIN_FAIL_JSON);
                        } else {
                            successLogin(req, user_id);
                            res.json(flag.FLAG_SUCCESS_JSON);
                        }
                    }
                    connection.release();
                });
            }
        });
    } catch (e) {
        res.json(flag.FLAG_ERROR_JSON);
    }

};
exports.facebookLogin = function (req, res) {
    try {
        var token = req.query.token;
        var url = 'https://graph.facebook.com/me?fields=email,name&access_token=' + token;

        https.get(url, function (result) {
            var body = '';
            result.on('data', function (chunk) {
                body += chunk;
            });
            result.on('end', function () {
                var fbResponse = JSON.parse(body);
                var user_id = Number(fbResponse.id);
                var email = fbResponse.email;
                var regDate = new Date().getTime();

                pool.getConnection(function (err, connection) {
                    if (err) {
                        console.log(err);
                        res.json(flag.FLAG_ERROR_JSON);
                        connection.release();
                    } else {
                        connection.query('INSERT INTO USER VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE USER_EMAIL=?', [user_id, email, 'facebook', regDate, email], function (err, result) {
                            if (err) {
                                console.log(err);
                                res.json(flag.FLAG_ERROR_JSON);
                            } else {
                                successLogin(req, user_id);
                                res.json(flag.FLAG_SUCCESS_JSON);
                            }
                            connection.release();
                        });
                    }
                });


            });
        });

    } catch (e) {
        res.json(flag.FLAG_ERROR_JSON);
    }
};
exports.logout = function (req, res) {
    req.session.user_id = undefined;
    res.json(flag.FLAG_SUCCESS_JSON);
}
var successLogin = function (req, user_id) {
    req.session.user_id = user_id;
};
