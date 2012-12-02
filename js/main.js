;(function($, geo, undefined) {

    "use strict";

    var api, Wunderground;

    Wunderground = (function() {
        function Wunderground(api_key) {
            this.key = api_key;

            this.BASE_URL = "http://api.wunderground.com/api/";
            this.TYPE = ".json";
        }

        Wunderground.prototype.getUrlForFeature = function(feature, querystring) {
            return this.BASE_URL + this.key + "/" + feature + "/q/"
                + querystring + this.TYPE;
        }

        Wunderground.prototype.get = function(feature, querystring, callback) {
            var url = this.getUrlForFeature(feature);

            $.get(url)
                .success
        }

        Wunderground.prototype.geolookup = function(lat, long, callback) {
            var querystring = lat + "," + long;
            this.get("geolookup", querystring, callback);
        };

        return Wunderground;
    }());

    var api = new Wunderground("d27376baed6757e1");

    function updatePosition(p) {
        api.geolookup(p.coords.latitude, p.coords.longitude);
        $("#location").html("Latitude: " + p.coords.latitude + "<br>Longitude: " + p.coords.longitude);
    }

    $(document).ready(function(){
        if (geo.init()) {
            geo.watchPosition(updatePosition);
        } else {
            $("#location").html("Geolocation is not supported by this browser.");
        }
    });

}(window.jQuery || {}, window.geo || {}));
