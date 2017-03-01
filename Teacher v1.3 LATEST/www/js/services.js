angular.module('starter.services', ['nvd3'])

.service('RTService', function ($http, Backand) {
  return {
    // for Dash tab
    dlStudentByRT: function() {
      console.log('getting data from backand')
      return $http({
        method: 'GET',
        url: Backand.getApiUrl() + '/1/objects/Student',
        params: {
          pageSize: 20,
          pageNumber: 1,
          filter: [{ fieldName: "rtActivity", operator: "notEmpty", value: null }],
          sort: [{"fieldName":"rtAttn","order":"asc"}]
        }})
    },

    saveAttn: function(dataList) {
      avgCounter = [0,0];
      studList = [];
      for (var item in dataList) {
        avgCounter[0] += 1;
        avgCounter[1] += dataList[item]['rtAttn'];
        studList.push({ name:dataList[item]['Name'], attn:dataList[item]['rtAttn'], photo:"img/" + dataList[item]['id'] + ".png"})
      }
      avg = Math.round(avgCounter[1]/avgCounter[0]);
      return [avg, studList];
    }
  }
})

.service('DataService', function ($http, Backand) {
/*
Provides functions for Past Sessions and Students tabs.
Function naming:
- dlSomethingByAnother (download from Something object in Backand, filtered by Another),
- save (write to localStorage), or
- get (retrieve from localStorage)
*/
  getCol = function(value) {
    if (value > 80) { return 'c0eccd' };
    if (value > 60) { return 'e6f7b2' };
    if (value > 40) { return 'fef4c3' };
    if (value > 20) { return 'fedac4' };
    return 'feb2b2';
  }

  return {
    // for Past Sessions tab
    dlSessionByActivity: function(activityname) {
      console.log('downloading data from backand');
      return $http({
        method: 'GET',
        url: Backand.getApiUrl() + '/1/objects/Session',
        params: {
          pageSize: 20,
          pageNumber: 1,
          filter: [{fieldName: "activity", operator: "equals", value: activityname }],
          sort: [{"fieldName":"avgAttn","order":"asc"}]
        }})
    },

    saveActivity: function(actdata) {
      window.localStorage['baActData'] = angular.toJson(actdata);
      actSummary = {}; // for collating session data
      studList = []; // for collating indiv student list and avg
      dataForGraph = []
      for (var item in actdata) { // loop over each session
        studList.push({id:eval(item)+1, name:actdata[item]['__metadata']['descriptives']['studentInfo']['label'], avg: actdata[item]['avgAttn'], photo: "img/" + actdata[item]['__metadata']['descriptives']['studentInfo']['label'] + ".png"})
        var data = eval(actdata[item]['sessionData']);
        for (var point in data) { // collate sessions into one dictionary
          if (actSummary.hasOwnProperty(data[point]['x'])) {
            actSummary[data[point]['x']][0] += data[point]['y'];
            actSummary[data[point]['x']][1] += 1;
          }
          else {
            actSummary[data[point]['x']] = [data[point]['y'], 1]
          }
        }
      }
      console.log("actSummary:", actSummary); // actSummary format: {time:[sum,count]}  eg. { 1728:[90,1], 1729:[84,1], 1730:[110,2], ...} 
      console.log("studList:", studList); // studList format: [{id:1, name:'Kevin', avg:49}, {id:2, name:'Siyan', avg:75}, ...]. already sorted by avg
      for (var time in actSummary) { // loop over items in dictionary, calculate average attn and put it back in graph data format
        dataForGraph.push({x:time/1, y:Math.round(actSummary[time][0]/actSummary[time][1])})
      }
      return {data: dataForGraph, studList: studList};
    },

    getActivity: function(studentNo) {
      try {
        var uglyDataStr = window.localStorage['baActData'];
        var uglyData = angular.fromJson(uglyDataStr);
        return uglyData[studentNo-1];
      }
      catch(err) {
        return [];
      }
    },

    // for Students tab
    dlStudentByClass: function(classId) {
      return $http({
        method: 'GET',
        url: Backand.getApiUrl() + '/1/objects/Student',
        params: {
          pageSize: 20,
          pageNumber: 1,
          filter: [{fieldName: 'FormClass', operator: 'in', value: classId}]
        }})
    },

    saveStudentList: function(classdata) {
      classList = {};
      for (var item in classdata) {
        someData = {};
        someData['id'] = (classdata[item]['id']);
        someData['Name'] = (classdata[item]['Name']);
        someData['lastSession'] = (classdata[item]['lastSession']);
        someData['photo'] = "img/" + (classdata[item]['Name']) + ".png";
        classList[classdata[item]['id']] = (someData);
      }
    window.localStorage['classList'] = angular.toJson(classList);
    },

    getStudentList: function() {
      var classString = window.localStorage['classList'];
      if(classString) {
        return angular.fromJson(classString);
      }
      return [];
    },

    dlSessionByStudent: function (studentId) {
      return $http({
        method: 'GET',
        url: Backand.getApiUrl() + '/1/objects/Session',
        params: {
          pageSize: 20,
          pageNumber: 1,
          filter: [{fieldName: "studentInfo", operator: "in", value: studentId }],
          sort: ''
        }})
    },

    saveSessionList: function(sessions) {
      sessionsList = [];
      for (var item in sessions) {
        someData = {};
        someData['number'] = eval(item)+1;
        someData['startTime'] = (sessions[item]['startTime']);
        someData['runTime'] = (sessions[item]['runTime']);
        someData['sessionData'] = (sessions[item]['sessionData']);
        someData['activity'] = (sessions[item]['activity']);
        someData['avgAttn'] = (sessions[item]['avgAttn']);
        sessionsList.push(someData);
        }
      window.localStorage['sessions'] = angular.toJson(sessionsList);
    },

    getSessionList: function() {
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


    // for both Students and Past Sessions tabs
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
  color: '#48be6d',
  area: true,
  values: null,
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

  return {
    checkClass: function(logins) {
    return $http({
      method: 'GET',
      url: Backand.getApiUrl() + '/1/objects/Classroom/',
      params: {
        pageSize: 20,
        pageNumber: 1,
        filter: [{ "fieldName": "ClassNumber", "operator": "equals", "value": logins.ClassNumber }, { "fieldName": "AdminKey", "operator": "equals", "value": logins.AdminKey }],
        sort: ''
      }
    }); //This checks for classroom with given class number and admin key
  }
  };
})
