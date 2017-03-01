angular.module('starter.services', ['nvd3'])

.service('DataService', function ($http, Backand, $rootScope) {

  sessionsUrl = function() {
    return Backand.getApiUrl() + '/1/objects/Session';
  };

  getCol = function(value) {
    if (value > 80) { return 'c0eccd' };
    if (value > 60) { return 'e6f7b2' };
    if (value > 40) { return 'fef4c3' };
    if (value > 20) { return 'fedac4' };
    return 'feb2b2';
  };

  return {
    // for Dash tab
    rtStart: function(activityName) {
      return $http ({
        method: 'PUT',
        url: Backand.getApiUrl() + '/1/objects/Student/' + $rootScope.specialLogin.id,
        data: { rtActivity: activityName }
      });
    },

    rtUpdate: function(attn) {
      return $http ({
        method: 'PUT',
        url: Backand.getApiUrl() + '/1/objects/Student/' + $rootScope.specialLogin.id,
        data: { rtAttn: attn }
      });
    },

    rtEnd: function() {
      return $http ({
        method: 'PUT',
        url: Backand.getApiUrl() + '/1/objects/Student/' + $rootScope.specialLogin.id,
        data: { rtActivity: null, rtAttn: null }
      });
    },

    // for History tab
    save: function(sessions) {
      sessionsList = [];
      for (var item in sessions) {
          someData = {};
          someData['number'] = eval(item)+1;
          someData['startTime'] = (sessions[item]['startTime']);
          someData['runTime'] = (sessions[item]['runTime']);
          someData['sessionData'] = (sessions[item]['sessionData']);
          someData['activity'] = (sessions[item]['activity']);
          sessionsList.push(someData);
        }
      window.localStorage['sessions'] = angular.toJson(sessionsList);
    },

    all: function() {
      var sessionsString = window.localStorage['sessions'];
      if(sessionsString) {
        return angular.fromJson(sessionsString);
      }
      return [];
    },

    getSession: function(sessionId) {
      var sessionsString = window.localStorage['sessions'];
      if(sessionsString) {
          var hi = angular.fromJson(sessionsString)
          return hi[sessionId-1];
        }
        return [];
    },

    getStudentSessions: function(studentId) {
      return $http({
        method: 'GET',
        url: Backand.getApiUrl() + '/1/objects/Session',
        params: {
          pageSize: 20,
          pageNumber: 1,
          filter: [{"fieldName":"studentInfo","operator":"in","value":studentId}],
          sort: ''
        }}); 
    },

    addSession: function(newSession) {
      return $http.post(sessionsUrl(), newSession);
      },

    calcAttn: function(dataList) {
      total = 0;
      high = { value: -1, time: null, col: '000' };
      low = { value: 101, time: null, col: '000' };
      avg = { value: 50, col: '000' };
      for (i in dataList) {
        total += dataList[i]['y']
        dataList[i]['y'] > high.value ? (high.value = dataList[i]['y'], high.time = dataList[i]['x']) : null;
        dataList[i]['y'] < low.value ? (low.value = dataList[i]['y'], low.time = dataList[i]['x']) : null;
      }
      avg.value = Math.round(total/dataList.length);
      high.col = getCol(high.value);
      avg.col = getCol(avg.value);
      low.col = getCol(low.value);
      return {high, avg, low};
    }
  }
})

// stores default chart options and data (eg. chart formatting, titles, colour)
.factory('ChartMaker', function() {
  var chartOptions = {
  chart: {
    type: 'lineChart',
    margin : { top: 20, right: 20, bottom: 20, left: 25},
    x: function(d){ return d.x; },
    y: function(d){ return d.y; },
    showLegend: false,
    useInteractiveGuideline: true,

    xAxis: {
    axisLabel: 'Time',
    tickFormat: function(d){
    return ( d >= 1000? d : '0'+d) + 'h';
    }
    },
    yDomain: [0,100],
    yAxis: {
    tickFormat: function(d){
    return d3.format('.0f')(d);
    },
    },
    callback: function(chart){
    console.log("!!! lineChart callback !!!");
    }
  },
  title: {
    enable: false,
    text: 'Title for Line Chart'
  },
  subtitle: {
    enable: false,
    text: 'Subtitle for simple line chart.'
  },
  caption: {
    enable: false,
    html: '<b>Figure 1.</b> Lorem ipsum dolor sit amet',
    css: {
    'text-align': 'justify',
    'margin': '10px 13px 0px 7px'
    }
  }
  };
  var chartData = [{
  key: 'Attention',
  color: '#00c5cd',
  area: true
  }];

  return {
  options: function() {
    return chartOptions;
  },
  data: function() {
    return chartData;
  }
  }
})

.service('loginCheck', function ($http, Backand) { //important!!

    function checkStudent(logins) {
        return $http({
            method: 'GET',
            url: Backand.getApiUrl() + '/1/objects/Student/',
            params: {
                pageSize: 20,
                pageNumber: 1,
                filter: [{ "fieldName": "Name", "operator": "equals", "value": logins.Name }, { "fieldName": "FormClass", "operator": "in", "value": logins.FormClass }],
                sort: ''
            }
        }); //This checks for student with given name and formclass

    }

    return {
        checkStudent: checkStudent
    };

})


.service('teacherView', function ($http, Backand) { //mute this one if you don't need it, I suppose.

    function getStudents() {
        return $http({
            method: 'GET',
            url: Backand.getApiUrl() + '/1/objects/Student',
            params: {
                pageSize: 20,
                pageNumber: 1,
                filter: null,
                sort: ''
            }
        }); //pretty straightforward from the name. Use it to display a list of student entries.

    }

    function getTimestamps(id) {
        return $http({
            method: 'GET',
            url: Backand.getApiUrl() + '/1/objects/Timestamp',
            params: {
                pageSize: 20,
                pageNumber: 1,
                filter: [{ "fieldName": "Owner", "operator": "in", "value": id }],
                sort: ''
            }
        }); //this works! Yay! It checks for the timestamps under that student id

    }


    addStudent = function (Student) {
        return $http.post(Backand.getApiUrl() + '/1/objects/Student/', Student); //idk why the short version works better than the long version...
    }

    deleteStudent = function (id) {
        return $http.delete(Backand.getApiUrl() + '/1/objects/Student/' + id);
    }


    updateStudent = function (id, Student) {
        return $http.put(Backand.getApiUrl() + '/1/objects/Student/', Student);
    }

    return {
        getStudents: getStudents,
        getTimestamps: getTimestamps,
        addStudent: addStudent,
        deleteStudent: deleteStudent,
        updateStudent: updateStudent

    };

});

