angular.module('starter.controllers', ['nvd3'])

.controller('DashCtrl', function($scope, $interval, RTService) {
  $scope.avgattention = 0;
  $scope.RTstart = function(activity) {
    $scope.viewingSession = true;

    updateAttn();
    colourchanging = $interval(updateAttn, 10000);
  }
  
  updateAttn = function() {
    RTService.dlStudentByRT()
    .then(function(result){
      console.log(result.data.data);
      RTinfo = RTService.saveAttn(result.data.data);
      $scope.avgattention = RTinfo[0];
      $scope.studList = RTinfo[1];
      console.log($scope.RTavg);
    })
  }

  $scope.RTend = function() {
    $scope.viewingSession = false;
    $interval.cancel(colourchanging);
  }
})

.controller('PastSessCtrl', function ($scope, $interval, $stateParams, DataService, ChartMaker) {
  getSampleGraph = function() {
    // $scope.session = DataService.getSession($stateParams.sessionId);
    $scope.session = {"number":1, "startTime":1466312856292, "runTime":403, "sessionData":"[{x:1812,y:94}, {x:1813,y:87}, {x:1814,y:48}, {x:1815,y:85}]", "activity":"Sleeping"};
    $scope.vm = {};
    $scope.vm.options = ChartMaker.options();
    $scope.vm.data = ChartMaker.data();
    $scope.vm.data[0]['values'] = eval($scope.session.sessionData);
    $scope.attn = DataService.calcAttn(eval($scope.session.sessionData));
  };

  getOverallGraph = function() {
    $scope.activityName = $stateParams.activityName;
    DataService.dlSessionByActivity($stateParams.activityName)
    .then(function(result){
      pastSessInfo = DataService.saveActivity(result.data.data);
      avgGraphData = pastSessInfo.data;
      $scope.studList = pastSessInfo.studList;
      // studList is already sorted by avg! format: [{id:1, name:'Kevin', avg:49}, {id:2, name:'Siyan', avg:75}, ...]
      $scope.vm = {};
      $scope.vm.options = ChartMaker.options();
      $scope.vm.data = ChartMaker.data();
      $scope.vm.data[0]['values'] = avgGraphData;
      $scope.attn = DataService.calcAttn(avgGraphData);
    })
  };

  getIndivSession = function() {
    $scope.activity = DataService.getActivity($stateParams.studentNo);
    $scope.vm = {};
    $scope.vm.options = ChartMaker.options();
    $scope.vm.data = ChartMaker.data();
    $scope.vm.data[0]['values'] = eval($scope.activity.sessionData);
    $scope.attn = DataService.calcAttn(eval($scope.activity.sessionData));
  }

  if ($stateParams.activityName) {
    if ($stateParams.studentNo) {
      getIndivSession();
    }
    else {
      getOverallGraph();
    }
  }

  
})


.controller('StudentsCtrl', function ($scope, $stateParams, ChartMaker, DataService, $timeout, $rootScope) { //this controller is slightly different from the student app one. 
  // autologin for easier editing
  // $rootScope.specialLogin = { ClassNumber: 101, AdminKey: 'hehehe', id:1 };

  $scope.opacity = 0.8;

  // downloads students in that class from backand, processes and saves class list locally
  $scope.getAllStudents = function () {
    $scope.studentList = null;
    $scope.opacity = 0.1;
    DataService.dlStudentByClass($rootScope.specialLogin.id)
    .then(function(result){
      DataService.saveStudentList(result.data.data);
      $scope.studentList = DataService.getStudentList();
      // studentList format: {"1":{"id":1, "Name":"Siyan"}, "2":{"id":2, "Name":"Kevin"}, "3": {"id":6, "Name":"JJJ"}, etc}
      $scope.opacity = 0.8;
      $scope.photo = "img/ben.png"
    })
  }
  
  $scope.getAllSessions = function () {
    $scope.sessionsList = null;
    $scope.studentName = $scope.studentList[$stateParams.studentId]["Name"];
    DataService.dlSessionByStudent($stateParams.studentId) 
    .then(function (result) {
      DataService.saveSessionList(result.data.data);
      $scope.sessionList = DataService.getSessionList();
      // sessionsList format: [{"number":1, "startTime":1466312856292, "runTime":403, "sessionData":"[{x:1812,y:94}, {x:1813,y:74}]", "activity":"Sleeping"}, etc]
    });
  }

  getThisSession = function() {
    $scope.session = DataService.getSession($stateParams.sessionId); // session format: {"number":1, "startTime":1466312856292, "runTime":403, "sessionData":"[{x:1812,y:94}, {x:1813,y:74}]", "activity":"Sleeping"}
    $scope.vm = {};
    $scope.vm.options = ChartMaker.options();
    $scope.vm.data = ChartMaker.data();
    $scope.vm.data[0]['values'] = eval($scope.session.sessionData);
    $scope.attn = DataService.calcAttn(eval($scope.session.sessionData));
  }

  if ($rootScope.specialLogin) {
    $scope.studentList = DataService.getStudentList();
    if ($scope.studentList == null) {
      $scope.getAllStudents();
    }
    if ($stateParams.studentId) {
      $scope.getAllSessions();
    }
    if ($stateParams.sessionId) {
      getThisSession();
    }
  }
  // makeChart();
  
})

.controller('LoginCtrl', function ($scope, $rootScope, loginCheck, $state) {  //checks for class & key
  $scope.loginAttempt = null
  $scope.log = {}
  $scope.loginDetails = {}

  $scope.verify = function (logins) {
    loginCheck.checkClass($scope.loginDetails)
    .then(function (result) {

      $scope.log = result.data.data
      try {
        if ($scope.log[0].ClassNumber == $scope.loginDetails.ClassNumber, $scope.log[0].AdminKey == $scope.loginDetails.AdminKey) { //seems like they store their data abit differently from what I actually thought.

          $scope.loginAttempt = true;
          $rootScope.specialLogin = $scope.loginDetails;
          $rootScope.specialLogin.id = $scope.log[0].id; // save class id for future reference
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

})

