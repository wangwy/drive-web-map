'use strict';

/* Directives */


angular.module('drive.directives', [])
    .directive('goodMap', ['bus', '$window', 'store', function (bus, $window, store) {
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
         * 用于存储发送过来的协议
         * @type {CollaborativeMap}
         */
        var mapMap = null;
        /**
         * 当设备上线时显示的地图标记的自定义图标
         * @type {string}
         */
        var image = 'img/markerIcon.png';

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

          google.maps.event.addListener(map,'click',function(event){
            mapMap.set(event.latLng.toString(),{coordinates: [event.latLng.lng(), event.latLng.lat()], deviceId: event.latLng.toString(), status: 'login'});
          });
        }

        /**
         * 设备上线或下线在地图上显示出来
         * @param latitude    纬度
         * @param longitude   经度
         * @param information 显示的信息
         * @param status      状态
         */
        function updateMarker(latitude, longitude, title, status, information) {
          if (markersArray) {
            for (var i in markersArray) {
              if (markersArray[i].getTitle() == title) {
                if (status == "login") {
                  markersArray[i].setIcon(image);
                  markersArray[i].setPosition(new google.maps.LatLng(latitude,longitude))
                } else if(status == "logout"){
                  markersArray[i].setIcon();
                } else if(status == "null"){
                  markersArray[i].setMap(null);
                  markersArray.splice(i,1);
                }
                return;
              }
            }
          }
          if (status == "login") {
            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(latitude, longitude),
              title: title,
              icon: image,
              map: map
            });
          } else {
            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(latitude, longitude),
              title: title,
              map: map
            });
          }
          var infowindow = new google.maps.InfoWindow({
            content: information
          });

          //当标签移到标记上时，显示标记里的信息
          google.maps.event.addListener(marker, 'mouseover', function () {
            infowindow.open(map, marker);
          });
          //当鼠标离开后，关闭标记上的信息
          google.maps.event.addListener(marker, 'mouseout', function(){
            infowindow.close();
          });
          //单击标记，设备下线
          google.maps.event.addListener(marker, 'click', function(){
            mapMap.set(marker.getPosition().toString(),{coordinates: [marker.getPosition().lng(), marker.getPosition().lat()], deviceId: marker.getPosition().toString(), status: 'logout'});
          });
          //双击标记，删除设备标记
          google.maps.event.addListener(marker, 'dblclick', function(){
            mapMap.set(marker.getPosition().toString(),{coordinates: [marker.getPosition().lng(), marker.getPosition().lat()], deviceId: marker.getPosition().toString(), status: 'null'});
            mapMap.remove(marker.getPosition().toString());
          });
          markersArray.push(marker);
        }

        /**
         * 更新在地图上显示的标签
         */
        var updateUi = function (evt) {
          updateMarker(mapMap.get(evt.property()).coordinates[1], mapMap.get(evt.property()).coordinates[0], mapMap.get(evt.property()).deviceId, mapMap.get(evt.property()).status, mapMap.get(evt.property()).information)
        }

        /**
         * 初始化collaborativeMap，并查询出设备
         * @param model 模型
         */
        var initializeModel = function (model) {
          var field = model.createMap();
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
            for(var i in datas){
              mapMap.set(datas[i]._source.deviceId,{coordinates: datas[i]._source.coordinates, deviceId: datas[i]._source.deviceId, status: 'login', information: datas[i]._source.owner});
            }
          });
          model.getRoot().set('mapMap', field);
        }


        /**
         *
         * @param doc
         */
        var onFileLoad = function (doc) {
          mapMap = doc.getModel().getRoot().get('mapMap');
          mapMap.onValueChanged(updateUi);
          initialize();
          var keys = mapMap.keys();
          if (mapMap.size() > 0) {
            for (var i = 0; i < mapMap.size(); i++) {
              var key = keys[i]
              updateMarker(mapMap.get(key).coordinates[1], mapMap.get(key).coordinates[0], mapMap.get(key).deviceId, mapMap.get(key).status, mapMap.get(key).information)
            }
          }

        }
        store.load("drivewebmap/17", onFileLoad, initializeModel, '');
      }

      return{
        restrict: 'A',
        link: link,
        replace: true
      }
    }]);
