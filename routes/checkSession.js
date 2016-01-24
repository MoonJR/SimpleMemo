/**
 * Created by MoonJR on 2016. 1. 13..
 // */
var flag = require('../manager/ErrorFlag');

exports.checkSession = function (req, res) {
    var session = req.session.user_id;
    if (!session) {
        res.json(flag.FLAG_SESSION_FAIL_JSON);
    } else {
        res.json(flag.FLAG_SUCCESS_JSON);
    }
};

exports.isLogin = function (req, res, next) {
    var session = req.session.user_id;
    if (!session) {
        res.statusCode = 401;
        res.json(flag.FLAG_SESSION_FAIL_JSON);
    } else {
        next();
    }
};