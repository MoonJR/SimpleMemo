/**
 * Created by MoonJR on 2016. 1. 13..
 */
var pool = require('../manager/MysqlConnectionPool').mysqlPool;
var fs = require('fs-extra');
var flag = require('../manager/ErrorFlag');
var downloadDeadLine = 1000 * 60 * 60 * 24 * 7;//다운로드 가능기간 7일
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

exports.download = function (req, res) {
    var user_id = req.session.user_id;
    if (!user_id) {
        user_id = req.query.user_id;
    }
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

exports.makeSimpleCode = function (req, res) {
    var contentsId = Number(req.body.contents_id);
    var passwd = req.body.passwd;
    if (passwd == 'undefined' || !passwd) {
        passwd = null;
    }

    var regDate = new Date().getTime();
    var deadLine = makeDeadLine(regDate, Number(req.body.dead_line_code));
    var simpleCode = makeRandomString() + makeRandomNumber();

    pool.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            res.json(flag.FLAG_ERROR_JSON);
        } else {
            connection.query('INSERT INTO CONTENTS_SIMPLE_CODE VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE CONTENTS_SIMPLE_CODE=? ,CONTENTS_PASSWD=?, REG_DATE=?, DEAD_LINE=? '
                , [contentsId, simpleCode, passwd, regDate, deadLine, simpleCode, passwd, regDate, deadLine]
                , function (err, result) {
                    if (err) {
                        console.log(err);
                        res.json(flag.FLAG_ERROR_JSON);
                    } else {
                        var result = flag.FLAG_SUCCESS_JSON;
                        result.simple_code = simpleCode;
                        res.json(result);
                    }
                    connection.release();
                });
        }
    });
};
exports.checkSimpleCode = function (req, res) {
    var simpleCode = req.body.simple_code.replace(/-/gi, '').toUpperCase();
    var nowDate = new Date().getTime();
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            res.json(flag.FLAG_ERROR_JSON);
        } else {
            connection.query('SELECT CASE WHEN dead_line>? THEN TRUE ELSE FALSE END remain_dead_line, CASE WHEN contents_passwd IS NULL THEN FALSE ELSE TRUE END is_passwd FROM CONTENTS_SIMPLE_CODE WHERE CONTENTS_SIMPLE_CODE=?'
                , [nowDate, simpleCode]
                , function (err, result) {
                    if (err) {
                        console.log(err);
                        res.json(flag.FLAG_ERROR_JSON);
                    } else {
                        if (result.length == 0) {
                            res.json(flag.FLAG_FILE_NOT_FOUND_CODE_JSON)
                        } else {
                            if (result[0].remain_dead_line) {
                                if (result[0].is_passwd) {
                                    res.json(flag.FLAG_FILE_REQUIRE_PASSWD_JSON);
                                } else {
                                    res.json(flag.FLAG_SUCCESS_JSON);
                                }
                            } else {
                                res.json(flag.FLAG_FILE_DEADLINE_JSON);
                            }
                        }

                    }
                    connection.release();
                });
        }
    });
}
exports.downloadSimpleCode = function (req, res, next) {
    var simpleCode = req.query.simple_code.replace(/-/gi, '').toUpperCase();
    var passwd = req.query.passwd;
    if (passwd == 'undefined' || !passwd || passwd == '') {
        passwd = null;
    }
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            res.json(flag.FLAG_ERROR_JSON);
        } else {
            connection.query('SELECT CONTENTS_DATA.user_id, CONTENTS_SIMPLE_CODE.contents_passwd, CONTENTS_SIMPLE_CODE.contents_id FROM CONTENTS_DATA, CONTENTS_SIMPLE_CODE WHERE CONTENTS_DATA.CONTENTS_ID=CONTENTS_SIMPLE_CODE.CONTENTS_ID AND CONTENTS_SIMPLE_CODE=?'
                , [simpleCode]
                , function (err, result) {
                    if (err) {
                        console.log(err);
                        res.json(flag.FLAG_ERROR_JSON);
                    } else {
                        if (result.length == 0) {
                            res.json(flag.FLAG_FILE_NOT_FOUND_CODE_JSON)
                        } else {
                            req.query.user_id = result[0].user_id;
                            req.query.contents_id = result[0].contents_id;
                            if (result[0].contents_passwd == null) {
                                next();
                            } else {
                                if (result[0].contents_passwd == passwd) {
                                    next();
                                } else {
                                    res.json(flag.FLAG_FILE_FAIL_PASSWD_JSON);
                                }
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

const deadLine_0 = 1000 * 60 * 60;
const deadLine_1 = 1000 * 60 * 60 * 6;
const deadLine_2 = 1000 * 60 * 60 * 12;
const deadLine_3 = 1000 * 60 * 60 * 24;
const deadLine_4 = 0;
var makeDeadLine = function (regDate, deadLineCode) {
    if (deadLineCode == 0) {
        return regDate + deadLine_0;
    } else if (deadLineCode == 1) {
        return regDate + deadLine_1;
    } else if (deadLineCode == 2) {
        return regDate + deadLine_2;
    } else if (deadLineCode == 3) {
        return regDate + deadLine_3;
    } else {
        return regDate + deadLine_4;
    }
};

var makeRandomString = function () {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZ";
    var string_length = 2;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
};
var makeRandomNumber = function () {
    var chars = "0123456789";
    var string_length = 4;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
};