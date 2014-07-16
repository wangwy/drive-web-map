/**
 * Created by wangwy on 14-7-15.
 */
angular.module('drive.services', [])
    .factory('store', function(){
      window.store = new realtime.store.StoreImpl("http://realtime.goodow.com:1986/channel", null);
      return store;
    })
    .factory('bus', ['store',function(store){
      var bus = store.getBus();
      return function(){
        return bus;
      }
    }]);