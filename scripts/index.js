$(document).ready(function() {
    let geocodeAPIURL = "https://maps.googleapis.com/maps/api/geocode/json?key=" + CONFIG.key;

    console.log();

    //I know it's a bad idea to leave my API key out in the open like this
    //but I figure that
    drawPlanetPhase(
        document.getElementById("moon"), 0.33, false, 
        {
            diameter:500, 
            earthshine:0, 
            shadowColour: "#1e132c", 
            lightColour: "#c2b9d8", 
            blur:2
        });

     
});
