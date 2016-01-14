/**
 * Created by MoonJR on 2016. 1. 13..
 */
var pool = require('../manager/MysqlConnectionPool').mysqlPool;
var flag = require('../manager/ErrorFlag');

exports.getContents = function (req, res) {
    var user_id = req.session.user_id;
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            res.json(flag.FLAG_ERROR_JSON);
            connection.release();
        } else {
            connection.query('SELECT contents_id, contents, contents_type FROM CONTENTS_DATA WHERE USER_ID = ?', [user_id], function (err, result) {
                if (err) {
                    console.log(err);
                    res.json(flag.FLAG_ERROR_JSON);
                } else {
                    var sendData = flag.FLAG_SUCCESS_JSON;
                    sendData.contents = result;
                    res.json(sendData);
                }
                connection.release();
            });
        }
    });
};