var express = require('express');
var router = express.Router();

var signup = require('./signup');
var login = require('./login');
var file = require('./file');
var getContents = require('./getContent');
var checkSession = require('./checkSession');
var writeMemo = require('./writeMemo');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({
    uploadDir: '/tmp',
    maxFilesSize: 256 * 1024 * 1024
});

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {title: 'Express'});
});

router.get('/signup', signup.signUp, login.login);
router.get('/login', login.login);
router.get('/facebookLogin', login.facebookLogin);
router.get('/checkSession', checkSession.checkSession);
router.get('/logout', login.logout);
router.get('/getContents', checkSession.isLogin, getContents.getContents);
router.get('/writeMemo', checkSession.isLogin, writeMemo.writeMemo);
router.post('/upload', checkSession.isLogin, multipartMiddleware, file.upload);
router.get('/download', checkSession.isLogin, file.download);
router.get('/makeSimpleCode', checkSession.isLogin, file.makeSimpleCode);
router.get('/checkSimpleCode', file.checkSimpleCode);
router.get('/downloadSimpleCode', file.downloadSimpleCode, file.download);

module.exports = router;
