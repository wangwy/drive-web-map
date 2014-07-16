'use strict';

/* Directives */

angular.module('drive', ['drive.directives','drive.services'])
    .controller('driveController',['$scope', function($scope){
      $scope.yourName = '11111';
    }]);
