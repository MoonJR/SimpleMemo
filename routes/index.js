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

router.post('/signup', signup.signUp, login.login);
router.post('/login', login.login);
router.post('/facebookLogin', login.facebookLogin);
router.get('/checkSession', checkSession.checkSession);
router.get('/logout', login.logout);
router.get('/getContents', checkSession.isLogin, getContents.getContents);
router.post('/writeMemo', checkSession.isLogin, writeMemo.writeMemo);
router.post('/upload', checkSession.isLogin, multipartMiddleware, file.upload);
router.get('/download', checkSession.isLogin, file.download);
router.post('/makeSimpleCode', checkSession.isLogin, file.makeSimpleCode);
router.post('/checkSimpleCode', file.checkSimpleCode);
router.get('/downloadSimpleCode', file.downloadSimpleCode, file.download);

var data = {
    success_code: 123,
    success_msg: '헬로',
    contents: [
        {title: '안녕하세요', title_id: 123},
        {title: '안녕하세요', title_id: 123},
        {title: '안녕하세요', title_id: 123},
        {title: '안녕하세요', title_id: 123},
        {title: '안녕하세요', title_id: 123}]
};

module.exports = router;
