angular.module('starter.controllers', ['nvd3'])

// controls all history data, links to ChartMaker and DataService
.controller('HistoryCtrl', function ($scope, $rootScope, $stateParams, ChartMaker, DataService) {
    // shortcut autologin for testing
    // $rootScope.specialLogin = { Name: 'siyan', FormClass: 1, id:1};

    $scope.opacity = 0.8;

    $scope.getAllSessions = function () {
        $scope.sessionsList = null;
        $scope.opacity = 0.1;
        try {
            DataService.getStudentSessions($rootScope.specialLogin.id)
                    .then(function (result) {
                        DataService.save(result.data.data);
                        $scope.sessionsList = DataService.all();
                        $scope.opacity = 0.8;
                    });
        } catch (e) {
            console.log('No login found!');
        }
    }

    getThisSession = function () {
        $scope.session = DataService.getSession($stateParams.sessionId);
        $scope.vm = {};
        $scope.vm.options = ChartMaker.options();
        $scope.vm.data = ChartMaker.data();
        $scope.vm.data[0]['values'] = eval($scope.session.sessionData);
        $scope.attn = DataService.calcAttn(eval($scope.session.sessionData));
    }

    if ($rootScope.specialLogin) {
        $scope.sessionsList = DataService.all();
        if ($scope.sessionsList == null) {
            $scope.getAllSessions();
        }
        if ($stateParams.sessionId) {
            getThisSession();
        }
    }
})

//  controls start/end session, timings (used by Dashboard tab)
.controller('DashCtrl', function ($scope, $interval, $http, Backand, DataService, $rootScope, ChartMaker) {
    $scope.attention = 0;
    $scope.graphDisplay = "none";
    $scope.connectionStatus = false;

    var connectionDetails = {};
    connectionDetails.PORT = 1337;
    $scope.login = {}

    $scope.vm = {};
    $scope.vm.options = ChartMaker.options();
    $scope.vm.data = ChartMaker.data();
    $scope.vm.data[0]['values'] = [];

    // records start time and calls updateTime and updateData every second/ minute respectively
    $scope.startSession = function (activityInput) {
        $scope.sessionOngoing = true;
        $scope.sessionEnded = false;
        $scope.graphDisplay = "none";
        $scope.dataParts = [];
        $scope.startTime = Date.now();
        $scope.activity = activityInput;
        $scope.updateData();
        if ($rootScope.specialLogin) {
            DataService.rtStart(activityInput);
            RTupdater = $interval($scope.updateRT, 10000);
        }
        timer = $interval($scope.updateTime, 1000);
        data = $interval($scope.updateData, 60000);
    }

    $scope.updateRT = function() {
        DataService.rtUpdate($scope.attention);
    }

    $scope.updateTime = function () {
        // runTime is in seconds
        $scope.runTime = Math.round((Date.now() - $scope.startTime) / 1000);
        $scope.runTimeH = Math.floor($scope.runTime / (60 * 60));
        $scope.runTimeM = Math.floor($scope.runTime / 60) - $scope.runTimeH * 60;
        $scope.runTimeS = $scope.runTime % 60;
    }

    $scope.updateData = function () {
        // INSERT GETTING DATA FROM HEADSET HERE
        if ($scope.attention == null) {
            $scope.attention = 60;
        }
        /*if ($scope.attention <= 20) {
            $scope.attention += 20 * Math.random();
        }
        else if ($scope.attention >= 80) {
            $scope.attention -= 20 * Math.random();
        }
        else {
            $scope.attention += 40 * Math.random() - 20;
        }*/
        $scope.attention = Math.round($scope.attention);

        var d = new Date();
        mins = d.getMinutes();
        if (mins==0) { mins = '00' } else if (mins<10) { mins = '0' + mins}; 
        var part = "{x:" + d.getHours() + mins + ",y:" + $scope.attention + "}"; 
        $scope.dataParts.push(part);
    }

    $scope.endSession = function () {
        $scope.sessionOngoing = false;
        $scope.sessionEnded = true;
        $scope.graphDisplay = "block";
        $interval.cancel(timer);
        $interval.cancel(data);
        $scope.dataCombined = '[' + $scope.dataParts.join(", ") + ']';
        $scope.vm.data[0]['values'] = eval($scope.dataCombined);
        $scope.attn = DataService.calcAttn(eval($scope.dataCombined));
        if ($rootScope.specialLogin) {
            $scope.dataToUpload = { studentInfo: $rootScope.specialLogin.id, startTime: $scope.startTime, runTime: $scope.runTime, sessionData: $scope.dataCombined, activity: $scope.activity, avgAttn: $scope.attn.avg.value };
            DataService.addSession($scope.dataToUpload);
            DataService.rtEnd();
        }
    }


    $scope.connect = function () { //main function

        var IPAddress = encodeURIComponent(String($scope.login.IPAddress1) + '.' + String($scope.login.IPAddress2) + '.' + String($scope.login.IPAddress3) + '.' + String($scope.login.IPAddress4)); // html5 so uncooperative =<

        console.log('Trying to connect to ' + IPAddress);

        chrome.sockets.tcp.create(function (createInfo) { //uses chrome sockets tcp plugin! check it out!

            connectionDetails.socketId = createInfo.socketId;
            console.log(connectionDetails.socketId);
            chrome.sockets.tcp.connect(
                connectionDetails.socketId,
                IPAddress,
                connectionDetails.PORT,
                connectedCallback)
        })

        connectedCallback = function (result) {

            if (result === 0) {

                console.log('Connected to ' + IPAddress);

                $scope.connectionStatus = true
                $scope.checkConnection()
                $scope.receive();

            }
            else {

                var errorMessage = 'Failed to connect to ' + IPAddress;
                console.log(errorMessage);
                navigator.notification.alert(errorMessage, function () { })

                $scope.connectionStatus = false
            }

        }

    }

    $scope.disconnect = function () { // end session
        chrome.sockets.tcp.close(connectionDetails.socketId, function () {
            console.log('TCP Socket close finished.');

            $scope.connectionStatus = false
            $scope.checkConnection();

        })

    }


    $scope.ledOn = function () { // test commands
        $scope.sendString('H');
    }

    $scope.ledOff = function () { // test commands
        $scope.sendString('L');

    }

    $scope.receive = function () { //sets up listener to receive information thrown by arduino
        chrome.sockets.tcp.onReceive.addListener(function (info) {
            if (info.socketId != connectionDetails.socketId)
                return;

            // info.data is an arrayBuffer. 
            $scope.attention = $scope.bufferToString(info.data)
            
            
        });
    }


    $scope.stringToBuffer = function (string) { //converts a string to a buffer to be sent across TCP to arduino
        var buffer = new ArrayBuffer(string.length)
        var bufferView = new Uint8Array(buffer)

        for (var i = 0; i < string.length; ++i) {

            bufferView[i] = string.charCodeAt(i)
        }

        return buffer;
    }

    $scope.bufferToString = function (buffer) { //converts an arraybuffer to a string to be read by the app
        return String.fromCharCode.apply(null, new Uint8Array(buffer))
    }

    $scope.sendString = function (sendString) { //uses chrome tcp to send information from the app to the arduino

        console.log('Trying to send:' + sendString)

        chrome.sockets.tcp.send(
            connectionDetails.socketId,
            $scope.stringToBuffer(sendString),
            function (sendInfo) {

                if (sendInfo.resultCode < 0) {

                    var errorMessage = 'Failed to send data'

                    console.log(errorMessage);
                    navigator.notification.alert(errorMessage, function () { })
                }
            }
        )
    }

    $scope.checkConnection = function () {
        if ($scope.connectionStatus == true) {
            $scope.header = "Connected"
        }
        if ($scope.connectionStatus == false) {
            $scope.header = "Not connected"
        }
    }

    $scope.checkConnection();
})

.controller('LoginCtrl', function ($scope, $rootScope, loginCheck, $state) {
    $scope.loginDetails = {} //to be used as input
    $scope.loginAttempt = null
    $scope.log = {}
    $scope.profpic = "img/ben.png"

    $scope.verify = function (logins) {
        loginCheck.checkStudent($scope.loginDetails)
        .then(function (result) {

            $scope.log = result.data.data
            try {
                if ($scope.log[0].Name == $scope.loginDetails.Name, $scope.log[0].FormClass == $scope.loginDetails.FormClass) { //seems like they store their data abit differently from what I actually thought.

                    $scope.loginAttempt = true;
                    $rootScope.specialLogin = $scope.loginDetails;
                    $rootScope.specialLogin.id = $scope.log[0].id; // added in student id so I can use it to get the student's history only
                    if ($rootScope.specialLogin.id == 1) {
                        $scope.profpic = "img/siyan.png"
                    }
                    else {
                        $scope.profpic = "img/ben.png"
                    }
                    $state.go('tab.account')
                }
            }
            catch (err) {
                $scope.loginAttempt = false;
            }

            $scope.loginDetails = {};
            $scope.log = {};

        })
    }

    $scope.logout = function () {
        $rootScope.specialLogin = null;
        $scope.loginAttempt = null;
        $state.go('login')
    }

    $scope.loginCheck = function () { //Not implemented yet but probably can use this to sign people out!
        if ($rootScope.specialLogin == {}) {
            $scope.loginAttempt = null;
        }
    }
});


