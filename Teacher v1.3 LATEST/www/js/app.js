// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

angular.module('starter', ['ionic', 'starter.controllers', 'starter.services','backand'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})


.config(function($stateProvider, $urlRouterProvider, BackandProvider, $ionicConfigProvider) {

  // forces tab bar to be at the bottom of the screen (android default is top which is ugly)
  $ionicConfigProvider.tabs.position('bottom');

  BackandProvider
  BackandProvider.setAppName('naoshi');
  BackandProvider.setAnonymousToken('ec262cc5-c5f3-4da1-b7b9-128ee6c8ea27');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:
  .state('login', {
    url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'

  })

  // in views: the first argument is the name of your tab.
  .state('tab.account', {
    url: '/account', 
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'LoginCtrl'
      }
    }
  })

    .state('tab.dash', {
    url: '/dashboard', 
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dashboard.html',
        controller: 'DashCtrl'
      }
    }
  })

  
//Class Average is almost the same, just that you average the entire data of the class  
  
  .state('tab.pastsessions', {
    url: '/pastsessions',
    views: {
      'tab-pastsessions': {
        templateUrl: 'templates/tab-pastsessions.html',
        controller: 'PastSessCtrl'
      }
    }
  })
  
  .state('tab.pastsessions-chart', {
    url: '/pastsessions/:activityName',
    views: {
      'tab-pastsessions': {
        templateUrl: 'templates/past-chart.html',
        controller: 'PastSessCtrl'
      }
    }
  })
  
  .state('tab.pastsessions-detail', {
    url: '/pastsessions/:activityName/:studentNo',
    views: {
      'tab-pastsessions': {
        templateUrl: 'templates/past-detail.html',
        controller: 'PastSessCtrl'
      }
    }
  }) 
  
  
  
//All the pages related to the Teacher App
  .state('tab.students', {
      url: '/Students',
      views: {
        'tab-students': {
          templateUrl: 'templates/tab-students.html',
          controller: 'StudentsCtrl'
        }
      }
	  
	  
    })

    .state('tab.students-list', {
      url: '/Students/:studentId',
      views: {
        'tab-students': {
          templateUrl: 'templates/students-list.html',
          controller: 'StudentsCtrl'
        }
      }
    })
	
	.state('tab.students-detail', {
      url: '/Students/Session/:sessionId',
      views: {
        'tab-students': {
          templateUrl: 'templates/students-detail.html',
          controller: 'StudentsCtrl'
        }
      }
    })

  /*.state('tab.data', {
    url: '/data',
    views: {
      'tab-data': {
        templateUrl: 'templates/tab-data.html',
        controller: 'DataCtrl'
      }
    }
  });*/

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
