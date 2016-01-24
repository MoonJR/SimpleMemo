/**
 * Created by MoonJR on 2016. 1. 13..
 */
var pool = require('../manager/MysqlConnectionPool').mysqlPool;
var fs = require('fs-extra');
var flag = require('../manager/ErrorFlag');

var savePath = null;

if (process.env.NODE_ENV == 'development' || !process.env.NODE_ENV) {
    console.log('개발자 모드로 서버를 시작합니다.');
    savePath = '/Users/MoonJR/Desktop/';
} else {
    console.log('배포 모드로 서버를 시작합니다.');
    savePath = '/root/SimpleMemo/SimpleMemoFiles/';
}


exports.upload = function (req, res) {
    var user_id = req.session.user_id;
    var fileName = req.files.file.name;

    var tmpPath = req.files.file.path;
    var reg_date = new Date().getTime();
    var targetPath = makePath(user_id, reg_date);

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
                            res.json(flag.FLAG_SUCCESS_JSON);
                        }
                        connection.release();
                    });
                }
            });
        }
    })
};

var downloadDeadLine = 1000 * 60 * 60 * 24 * 7;//다운로드 가능기간 7일

exports.download = function (req, res) {
    var user_id = req.session.user_id;
    var contentsId = Number(req.query.contents_id);
    var nowDate = new Date().getTime();

    var filePath = makePath(user_id, contentsId);

    if (nowDate - contentsId > downloadDeadLine) {
        res.json(flag.FLAG_FILE_DEADLINE_JSON);
        return;
    } else if (!fs.existsSync(filePath)) {
        res.json(flag.FLAG_FILE_NOT_FOUND_JSON);
        return;
    }

    pool.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            res.json(flag.FLAG_ERROR_JSON);
            connection.release();
        } else {
            connection.query('SELECT CONTENTS, CONTENTS_DOWNLOAD_COUNT FROM CONTENTS_DATA WHERE USER_ID=? AND CONTENTS_ID=?', [user_id, contentsId], function (err, result) {
                if (err) {
                    console.log(err);
                    res.json(flag.FLAG_ERROR_JSON);
                } else {
                    //console.log(result);
                    if (result.length == 0) {
                        res.json(flag.FLAG_FILE_NOT_FOUND_JSON);
                    } else {
                        if (result[0].CONTENTS_DOWNLOAD_COUNT > 30) {
                            res.json(flag.FLAG_FILE_DOWNLOAD_OVER_JSON);
                        } else {
                            res.download(filePath, result[0].CONTENTS, function (err) {
                                if (!err) {
                                    downloadCountUp(user_id, contentsId);
                                }
                            });
                        }
                    }
                }
                connection.release();
            });
        }
    });
};

var downloadCountUp = function (userId, contentsId) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            connection.release();
        } else {
            connection.query('UPDATE CONTENTS_DATA SET CONTENTS_DOWNLOAD_COUNT = CONTENTS_DOWNLOAD_COUNT + 1 WHERE USER_ID = ? AND CONTENTS_ID = ?', [userId, contentsId], function (err, result) {
                if (err) {
                    console.log(err);
                }
                connection.release();
            });
        }
    });
};


var makePath = function (user_id, reg_date) {
    return savePath + user_id + '/' + reg_date; //저장 경로
};