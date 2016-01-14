/**
 * Created by MoonJR on 2016. 1. 4..
 */
var app = angular.module('SimpleMemo', ['ngAnimate', 'toastr']);
app.controller('loginCtrl', function ($scope, $http, $rootScope, toastr) {
    $scope.login = {
        email: '',
        passwd: '',
        isLoading: false,
        isLogin: false
    };
    $scope.signup = {
        email: '',
        passwd: '',
        passwdRepeat: '',
        isShowSignup: true
    };
    $scope.sendLogin = function () {
        if ($scope.login.email == '') {
            toastr.warning('이메일을 입력해 주세요.', 'Warning');
            return;
        } else if ($scope.login.passwd == '') {
            toastr.warning('비밀번호를 입력해 주세요.', 'Warning');
            return;
        }
        $scope.login.isLoading = true;
        $http.get(
            "/login?email=" + $scope.login.email
            + "&passwd=" + $scope.login.passwd).success(
            function (response) {
                if (response.success_code == 2000) {
                    $scope.successLogin(true);
                } else if (response.success_code = 3000) {
                    toastr.error('로그인 실패\n정보를 확인해 주세요.', 'Error');
                } else {
                    toastr.error('서버 오류.', 'Error');
                }
                $scope.login.isLoading = false;
            });
    };
    $scope.sendFacebookLogin = function () {
        FB.login(function (response) {
            $scope.openDropdown();
            if (response.status === 'connected') {
                $scope.login.isLoading = true;
                $http.get(
                    "/facebookLogin?token="
                    + response.authResponse.accessToken).success(
                    function (response) {
                        if (response.success_code == 2000) {
                            $scope.successLogin(true);
                        } else if (response.success_code == 3001) {
                            toastr.error(
                                'Facebook 계정 정보 부족(이메일을 가져올 수 없습니다.',
                                'Error');
                        } else {
                            toastr.error('서버 오류', 'Error');
                        }
                        $scope.login.isLoading = false;
                    });
            }
        }, {
            scope: 'public_profile,email'
        });
    };
    $scope.facebookInit = function () {
        // Facebook Login
        window.fbAsyncInit = function () {
            FB.init({
                appId: '1524068394588343',
                cookie: true,
                xfbml: true,
                version: 'v2.5'
            });
        };
        // Load the SDK asynchronously
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id))
                return;
            js = d.createElement(s);
            js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    };
    $scope.sendLogout = function () {
        $http.get("/logout").success(function (response) {
            if (response.success_code != 2000) {
                toastr.error('서버 오류', 'Error');
            }
            $scope.successLogin(false);
        });
    };
    $scope.checkSession = function () {
        $http.get("/checkSession").success(function (response) {
            if (response.success_code == 2000) {
                $scope.successLogin(true);
            } else {
                $scope.successLogin(false);
            }
        });
    };
    $scope.closeDropdown = function () {
        angular.element(document.getElementById('dropdown'))
            .removeClass('open');
    };
    $scope.openDropdown = function () {
        angular.element(document.getElementById('dropdown')).addClass('open');
    };
    $scope.openSignup = function () {
        $scope.signup.isShowSignup = false;
    };
    $scope.sendSignup = function () {
        if ($scope.signup.email == '') {
            toastr.warning('이메일을 입력해 주세요.', 'Warning');
            return;
        } else if (typeof $scope.signup.email == 'undefined') {
            toastr.warning('정확한 이메일을 입력해 주세요.', 'Warning');
            return;
        } else if ($scope.signup.passwd == '') {
            toastr.warning('비밀번호를 입력해 주세요.', 'Warning');
            return;
        } else if ($scope.signup.passwd != $scope.signup.passwdRepeat) {
            toastr.warning('비밀번호 확인과 비밀버호를 같은 비밀번호로 입력해 주세요.', 'Warning');
            return;
        }
        $scope.login.isLoading = true;
        $http.get(
            "/signup?email=" + $scope.signup.email
            + "&passwd=" + $scope.signup.passwd).success(
            function (response) {
                if (response.success_code == 2000) {
                    $scope.successLogin(true);
                } else if (response.success_code == 4000) {
                    toastr.warning('이미 등록된 이메일 입니다.', 'Warning');
                } else if (response.success_code = 3000) {
                    toastr.error('회원가입 실패\n정보를 확인해 주세요.', 'Error');
                } else {
                    toastr.error('서버 오류.', 'Error');
                }
                $scope.login.isLoading = false;
            });
    };
    $scope.successLogin = function (isLogin) {
        if (isLogin) {
            toastr.success('환영합니다.', 'SimpleMemo');
        }
        $scope.closeDropdown();
        $scope.login.isLogin = isLogin;
        $rootScope.$broadcast('login', isLogin);

    };
});
app.controller('contentsCtrl', function ($scope, $http, toastr) {
    $scope.login = {
        isLogin: false
    };
    $scope.$on('login', function (event, args) {
        $scope.login.isLogin = args;
        if (args) {
            $scope.getContents();
        }
    });
    $scope.memo = {
        contents: ''
    };
    $scope.writeMemo = function () {
        if ($scope.memo.contents == '') {
            toastr.info('메모를 입력해 주세요.', 'Information');
            return;
        }
        $http.get("/writeMemo?contents=" + $scope.memo.contents)
            .success(function (response) {
                if (response.success_code != 2000) {
                    toastr.error('서버 오류.', 'Error');
                } else {
                    $scope.memo.contents = '';
                }
                $scope.getContents();
            });
    };
    $scope.getContents = function () {
        $http.get("/getContents").success(function (response) {
            $scope.contents = response.contents;
        });
    };
    $scope.isFile = function (type) {
        if (type == 1) {
            return false;
        } else {
            return true;
        }
    };
    $scope.downloadFile = function (contents_id) {
        location.href = '/download?contents_id=' + contents_id;
    };
});
Dropzone.options.dropzone = {
    maxFilesize: 256,
    init: function () {
        this.on("complete", function (file) {
            angular.element(document.getElementById('contents')).scope()
                .getContents();
        });
    }
};
