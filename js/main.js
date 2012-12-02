;(function() {
    "use strict";

    var geo = window.geo;

    function getLocation() {
        if (geo.init()) {
            geo.watchPosition(showPosition);
        } else {
            $("#location").html("Geolocation is not supported by this browser.");
        }
    }
    
    function showPosition(position) {
        $("#location").html("Latitude: " + position.coords.latitude + "<br>Longitude: " + position.coords.longitude);
    }
    
    $(document).ready(function(){
        getLocation();
    });

}());
