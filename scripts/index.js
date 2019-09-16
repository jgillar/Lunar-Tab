window.addEventListener("load", function () {
    /* submit button event listener for the location search box */
    document.getElementById("location-form").addEventListener("submit", function (event) {
        event.preventDefault();
        geocoder.send(document.getElementById("location-textbox").value);
        populateMoonStats();
    });

    //return time in 12-hour format along with AM/PM as a string
    let timeToString = function(time) {
        return "" + time.getHours() % 12 + ":" + time.getMinutes() + " " + (time.getHours() > 12 ? "PM" : "AM");
    };

    // populates the moonrise, moonset, etc. containers
    let populateMoonStats = function() {
        let times = SunCalc.getMoonTimes(new Date(), window.localStorage.latitude, window.localStorage.longitude);
        document.querySelector("#box-moonrise span:nth-child(2)").innerHTML = timeToString(times.rise);
        document.querySelector("#box-moonset span:nth-child(2)").innerHTML = timeToString(times.set);
 
        let illumination = SunCalc.getMoonIllumination(new Date());
        document.querySelector("#box-phase span:first-child").innerHTML = ((phase) => {
            if(phase === 0)
                return "New Moon";
            else if(phase < .25)
                return "Waxing Crescent";
            else if(phase === .25)
                return "First Quarter";
            else if(phase < .5)
                return "Waxing Gibbous";
            else if(phase === .5)
                return "Full Moon";
            else if(phase < .75)
                return "Waning Gibbous";
            else if(phase === .75)
                return "Last Quarter";
            else
                return "Waning Crescent";
        })();
        document.querySelector("#box-phase span:nth-child(2)").innerHTML = Math.round(illumination.fraction * 100) + "%";
        drawPlanetPhase(
            document.getElementById("moon"), illumination.fraction, false,
            {
                diameter: 500,
                earthshine: 0,
                shadowColour: "#1e132c",
                lightColour: "#c2b9d8",
                blur: 2
            });
    };

    populateMoonStats();
    /* just a simple object for handling API calls
        @buildQuery  builds up a query string 
        @send        ajax request to the api, returns null on error or long/lat pair on success
    */
        let geocoder = {
        url: "https://maps.googleapis.com/maps/api/geocode/json?",
        key: CONFIG.key,
        buildQuery: function (value) {
            return this.url + encodeURI("address=" + value + "&key=" + CONFIG.key);
        },
        send: function (value) {
            let request = new XMLHttpRequest();

            //successful request 
            request.addEventListener("load", (event) => {
                if (event.target.status === 200) {
                    let responseObj = JSON.parse(event.target.responseText);



                    let localStorage = window.localStorage;
                    //store the long/lat coords and location name for quick access
                    console.log("localstorage");
                    localStorage.setItem("longitude", responseObj.results[0].geometry.location.lng);
                    localStorage.setItem("latitude", responseObj.results[0].geometry.location.lat);
                    localStorage.setItem("address", responseObj.results[0].formatted_address);
                    console.log(localStorage);
                }
                //request denied, over daily API limit, etc. misc errors
                else {
                    return null;
                }
                return event.target.responseText;
            });

            //error, couldn't send request
            request.addEventListener("error", (event) => {
                return null;
            });

            request.open("POST", this.buildQuery(value));
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            request.send();
        }
    };
});
