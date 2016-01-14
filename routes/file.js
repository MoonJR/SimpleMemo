/**
 * Created by MoonJR on 2016. 1. 13..
 */
var pool = require('../manager/MysqlConnectionPool').mysqlPool;
var fs = require('fs-extra');
var flag = require('../manager/ErrorFlag');
const savePath = '/Users/MoonJR/Desktop/';

exports.upload = function (req, res) {
    var user_id = req.session.user_id;
    var fileName = req.files.file.name;

    var tmpPath = req.files.file.path;
    var targetPath = makePath(user_id, fileName);
    var reg_date = new Date().getTime();

    fs.move(tmpPath, targetPath, function (err) {
        if (err) {
            console.log(err);
            res.json(flag.FLAG_ERROR_JSON);
        } else {
            pool.getConnection(function (err, connection) {
                if (err) {
                    console.log(err);
                    res.json(flag.FLAG_ERROR_JSON);
                    connection.release();
                } else {
                    connection.query('INSERT INTO CONTENTS_DATA VALUES(?,?,?,?,?)', [user_id, reg_date, fileName, flag.FLAG_CONTENTS_TYPE_FILE, 0], function (err, result) {
                        if (err) {
                            console.log(err);
                            res.json(flag.FLAG_ERROR_JSON);
                        } else {
                            console.log('success');
                            res.json(flag.FLAG_SUCCESS_JSON);
                        }
                        connection.release();
                    });
                }
            });
        }
    })
};
exports.download = function (req, res) {
    var user_id = req.session.user_id;
    var contentsId = Number(req.query.contents_id);

    pool.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            res.json(flag.FLAG_ERROR_JSON);
            connection.release();
        } else {
            connection.query('SELECT contents FROM CONTENTS_DATA WHERE USER_ID=? AND CONTENTS_ID=?', [user_id, contentsId], function (err, result) {
                if (err) {
                    console.log(err);
                    res.json(flag.FLAG_ERROR_JSON);
                } else {
                    console.log(result);
                    if (result.length == 0) {
                        res.json(flag.FLAG_FILE_NOT_FOUND_JSON);
                    } else {
                        var targetFile = makePath(user_id, result[0].contents);
                        if (!fs.existsSync(targetFile)) {
                            res.json(flag.FLAG_FILE_NOT_FOUND_JSON);
                        } else {
                            res.download(targetFile);
                        }
                    }
                }
                connection.release();
            });
        }
    });
};


var makePath = function (user_id, fileName) {
    return savePath + user_id + '/' + fileName; //저장 경로
}