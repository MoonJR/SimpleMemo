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
            connection.query('SELECT CONTENTS_DATA.contents_id, CONTENTS_DATA.contents,CONTENTS_DATA.contents_type, CONTENTS_SIMPLE_CODE.contents_simple_code, CONTENTS_SIMPLE_CODE.dead_line, CASE WHEN CONTENTS_SIMPLE_CODE.CONTENTS_PASSWD IS NULL THEN FALSE ELSE TRUE END is_passwd FROM CONTENTS_DATA LEFT OUTER JOIN CONTENTS_SIMPLE_CODE ON CONTENTS_DATA.CONTENTS_ID = CONTENTS_SIMPLE_CODE.CONTENTS_ID WHERE USER_ID = ?', [user_id], function (err, result) {
                if (err) {
                    console.log(err);
                    res.json(flag.FLAG_ERROR_JSON);
                } else {
                    var sendData = flag.FLAG_SUCCESS_JSON.constructor();
                    sendData.contents = result;
                    res.json(sendData);
                    console.log(flag.FLAG_SUCCESS_JSON);
                }
                connection.release();
            });
        }
    });
};