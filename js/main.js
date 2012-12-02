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

        Wunderground.prototype.get = function(feature, querystring, callback, errorback) {
            var url = this.getUrlForFeature(feature);

            $.when(
                $.ajax({
                    url: url,
                    dataType: "jsonp",
                })
            )
                .then(callback)
                .fail(errorback);
        }

        Wunderground.prototype.conditions = function(lat, long, callback, errorback) {
            var querystring = lat + "," + long;
            this.get("conditions", querystring, callback, errorback);            
        }

        Wunderground.prototype.geolookup = function(lat, long, callback, errorback) {
            var querystring = lat + "," + long;
            this.get("geolookup", querystring, callback, errorback);
        };

        return Wunderground;
    }());

    api = new Wunderground("d27376baed6757e1");

    function updatePosition(p) {
        api.conditions(p.coords.latitude, p.coords.longitude, handleLocalWeather);
        $("#location").html("Latitude: " + p.coords.latitude + "<br>Longitude: " + p.coords.longitude);
        _.extend(window.location_info, {latitude: p.coords.latitude, longitude: p.coords.longitude});
        var seed = (Math.floor(location_info.latitude)+','+Math.floor(location_info.longitude));
        $('html').append("<h1>"+seed+"</h1>");
        _.extend(window.location_info, {rng: new Randomizer({ rng : 'MersenneTwister' , seed : seed}) });
        if(typeof(window.audioletApp) == 'undefined') window.audioletApp = new AudioletApp();
    }

    function handleLocalWeather(response) {
        console.log(response);
    }

    $(document).ready(function(){
        window.location_info = {};
        if (geo.init()) {
            geo.watchPosition(updatePosition);
        } else {
            $("#location").html("Geolocation is not supported by this browser.");
        }
    });

}(window.jQuery || {}, window.geo || {}));
