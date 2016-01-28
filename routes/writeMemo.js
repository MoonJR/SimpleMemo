/**
 * Created by MoonJR on 2016. 1. 14..
 */
var pool = require('../manager/MysqlConnectionPool').mysqlPool;
var flag = require('../manager/ErrorFlag');

exports.writeMemo = function (req, res) {

    var user_id = req.session.user_id;
    var reg_date = new Date().getTime();
    var contents = req.body.contents;

    pool.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            res.json(flag.FLAG_ERROR_JSON);
            connection.release();
        } else {
            connection.query('INSERT INTO CONTENTS_DATA VALUES(?,?,?,?,?)', [user_id, reg_date, contents, flag.FLAG_CONTENTS_TYPE_STRING, 0], function (err, result) {
                if (err) {
                    console.log(err);
                    res.json(flag.FLAG_ERROR_JSON);
                } else {
                    res.json(flag.FLAG_SUCCESS_JSON);
                }
                connection.release();
            });
        }
    });
};


