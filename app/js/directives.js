'use strict';

/* Directives */


angular.module('drive.directives',[])
    .directive('goodMap', ['bus', '$window', function (bus, $window) {
      function link(scope, element, attrs) {
        /**
         * google地图
         */
        var map;
        /**
         * google地图标记数组
         * @type {Array}
         */
        var markersArray = [];
        /**
         * 当设备上线时显示的地图标记的自定义图标
         * @type {string}
         */
        var image = 'img/markerIcon.png';

        /**
         * 获取在线的所有设备
         */
        function getLogin() {
          var searchParam = {
            "action": "search",
            "_index": "drive_test",
            "_type": "deviceStatus",
            "source": {
              "size": 10000,
              "query": {
                "term": {"status": "login"}
              }
            }
          };


          bus().send("realtime/search", searchParam, function (message) {
            var datas = message.body().hits.hits;
            if (!datas || datas.length == 0) {
              return;
            }
            scope.$apply(function () {
              scope.mapInfos = datas;
            });
          });
        }


        /**
         * 监听drive.devicestatus频道
         */
        bus().subscribe("drive/devicestatus", function (registerMessage) {
          scope.$apply(function () {
            scope.mapInfo = registerMessage.body();
          });
        });

        /**
         * 初始化地图，中心为北京
         */
        function initialize() {
          var mapOptions = {
            center: new google.maps.LatLng(39.92, 116.46),
            zoom: 4,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };
          element.css({
            height: $window.screen.height + 'px'
          });
          map = new google.maps.Map(element[0], mapOptions);

          getLogin();
        }


        /**
         * 设备上先后再地图上显示出来
         * @param latitude    纬度
         * @param longitude   经度
         * @param information 显示的信息
         * @param status      状态
         */
        function addMarker(latitude, longitude, title, information) {
          if (markersArray) {
            for (var i in markersArray) {
              if (markersArray[i].getTitle() == title) {
                markersArray[i].setIcon(image);
                return;
              }
            }
          }
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(latitude, longitude),
            title: title,
            icon: image,
            map: map
          });
          var infowindow = new google.maps.InfoWindow({
            content: information
          });

          //当标签移到标记上时，显示标记里的信息
          google.maps.event.addListener(marker, 'mouseover', function () {
            infowindow.open(map, marker);
          });

          markersArray.push(marker);
        }

        /**
         * 设备下线后更改地图上标记的图标
         * @param latitude    经度
         * @param longitude   纬度
         * @param information 显示的信息
         * @param status      状态
         */
        function changeMarker(title) {
          if (markersArray) {
            for (var i in markersArray) {

              if (markersArray[i].getTitle() == title) {
                markersArray[i].setIcon();
              }
            }
          }
        };

        /**
         * 监听设备上线、下线
         */
        scope.$watch('mapInfo', function (newValue, oldValue) {
          if (newValue !== oldValue && newValue !== "[]") {
            if (newValue.status == "login") {
              addMarker(newValue.coordinates[1], newValue.coordinates[0], newValue.deviceId, newValue.owner);
            } else if (newValue.status == "logout") {
              changeMarker(newValue.deviceId);
            }
          }
        });


        /**
         * 获取所有的在线设备
         */
        scope.$watch('mapInfos', function (newValue, oldValue) {
          if (newValue !== oldValue && newValue.length != 0) {
            for (var i in newValue) {
              addMarker(newValue[i]._source.coordinates[1], newValue[i]._source.coordinates[0], newValue[i]._source.deviceId, newValue[i]._source.owner)
            }
          }
        });
        google.maps.event.addDomListener(window, 'load', initialize);
//        initialize();
      }

      return{
        restrict: 'A',
        link: link,
        replace: true
      }
    }]);
