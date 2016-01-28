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
    $scope.simpleCode = {
        code: '',
        passwd: ''
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

        $http.post('/login', $scope.login).success(function (response) {
            if (response.success_code == 2000) {
                $scope.successLogin(true);
            } else if (response.success_code = 3000) {
                toastr.error('로그인 실패\n정보를 확인해 주세요.', 'Error');
            } else {
                toastr.error('서버 오류.', 'Error');
            }
            $scope.login.isLoading = false;
        }).error(function () {
            toastr.error('서버 오류.', 'Error');
            $scope.login.isLoading = false;
        });
    };
    $scope.sendFacebookLogin = function () {
        FB.login(function (response) {
            $scope.openDropdown();
            if (response.status === 'connected') {
                $scope.login.isLoading = true;
                $http.post('/facebookLogin', {token: response.authResponse.accessToken}).success(function (response) {
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
                }).error(function () {
                    toastr.error('서버 오류', 'Error');
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
        $http.post(
            '/signup', $scope.signup).success(
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
            }).error(function () {
            toastr.error('서버 오류.', 'Error');
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
    $scope.checkSimpleCode = function () {
        $http.post(
            '/checkSimpleCode', {simple_code: $scope.simpleCode.code}).success(
            function (response) {
                console.log(response);
                if (response.success_code == 6003) {
                    toastr.error('다운로드 코드가 존재하지 않습니다.', 'Error');
                } else if (response.success_code == 6002) {
                    toastr.error('다운로드 기간이 만료되었습니다.', 'Error');
                } else if (response.success_code == 6005) {
                    angular.element(document.getElementById('simpleDownloadOpenModal')).trigger('click');
                } else if (response.success_code == 2000) {
                    $scope.downloadFile();
                }
            }).error(function () {
            toastr.error('서버 오류.', 'Error');
        });
    };
    $scope.downloadFile = function () {
        angular.element(document.getElementById('simpleDownloadModal')).removeClass('in');
        location.href = '/downloadSimpleCode?simple_code=' + $scope.simpleCode.code + '&passwd=' + $scope.simpleCode.passwd;
    }


});
app.controller('contentsCtrl', function ($scope, $http, toastr) {
    $scope.login = {
        isLogin: false
    };
    $scope.simpleCode = {
        contents_id: '',
        contents: '',
        passwd: '',
        dead_line_code: '',
        isLoading: false,
        isSecure: false
    };
    $scope.memo = {
        contents: ''
    };
    $scope.$on('login', function (event, args) {
        $scope.login.isLogin = args;
        if (args) {
            $scope.getContents();
        }
    });
    $scope.setSimpleCode = function (contents_id, contents) {
        $scope.simpleCode.contents_id = contents_id;
        $scope.simpleCode.contents = contents;
        $scope.simpleCode.passwd = undefined;
        $scope.simpleCode.isSecure = false;
    };
    $scope.makeSimpleCode = function () {

        if ($scope.simpleCode.isSecure) {
            if ($scope.simpleCode.passwd == '' || !$scope.simpleCode.passwd) {
                toastr.error('비밀번호를 입력해주세요.', 'Error');
                return;
            }
        }

        $scope.simpleCode.isLoading = true;

        $http.post('/makeSimpleCode', $scope.simpleCode)
            .success(function (response) {
                if (response.success_code != 2000) {
                    toastr.error('서버 오류.', 'Error');
                } else {
                    toastr.info('code:' + $scope.formatSimpleCode(response.simple_code), '심플코드 생성 성공');
                    angular.element(document.getElementById('myModal'))
                        .removeClass('in');
                }
                $scope.simpleCode.isLoading = false;
                $scope.getContents();
            }).error(function () {
            toastr.error('서버 오류.', 'Error');
            $scope.simpleCode.isLoading = false;
            $scope.getContents();
        });
    };
    $scope.formatSimpleCode = function (simpleCode, isPasswd) {
        if (simpleCode) {
            var result = simpleCode.substr(0, 2) + '-' + simpleCode.substr(2);
            if (isPasswd) {
                return result + '*';
            } else {
                return result;
            }

        } else {
            return '';
        }
    };
    $scope.formatDeadLine = function (deadLine) {
        var remainDate = deadLine - new Date().getTime();
        if (remainDate <= 0) {
            return '코드 활성 기간 종료';
        } else {
            var hour = Math.floor(remainDate / (1000 * 60 * 60));
            var min = Math.floor((remainDate % (1000 * 60 * 60)) / (60 * 1000));
            return hour + '시간 ' + min + '분 남았습니다.'
        }
    };
    $scope.writeMemo = function () {
        if ($scope.memo.contents == '') {
            toastr.info('메모를 입력해 주세요.', 'Information');
            return;
        }
        $http.post('/writeMemo', $scope.memo)
            .success(function (response) {
                if (response.success_code != 2000) {
                    toastr.error('서버 오류.', 'Error');
                } else {
                    $scope.memo.contents = '';
                }
                $scope.getContents();
            }).error(function () {
            toastr.error('서버 오류.', 'Error');
        });
    };
    $scope.getContents = function () {
        $http.get("/getContents").success(function (response) {
            $scope.contents = response.contents;
            console.log($scope.contents);
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
