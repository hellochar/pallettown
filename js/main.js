;(function($, geo, undefined) {

    "use strict";

    function updatePosition(p) {
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
