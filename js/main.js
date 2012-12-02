;(function($, geo, undefined) {

    "use strict";

    function updatePosition(p) {
        //todo: add more features here (weather, time, etc.)
        $("#location").html("Latitude: " + p.coords.latitude + "<br>Longitude: " + p.coords.longitude);
        _.extend(window.location_info, {latitude: p.coords.latitude, longitude: p.coords.longitude});
        var seed = (Math.floor(location_info.latitude)+','+Math.floor(location_info.longitude));
        $('html').append("<h1>"+seed+"</h1>");
        _.extend(window.location_info, {rng: new Randomizer({ rng : 'MersenneTwister' , seed : seed}) });
        if(typeof(window.audioletApp) == 'undefined') window.audioletApp = new AudioletApp();
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
