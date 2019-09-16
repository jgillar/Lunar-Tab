window.addEventListener("load", function () {
    /* submit button event listener for the location search box */
    document.getElementById("location-form").addEventListener("submit", function (event) {
        event.preventDefault();
        geocoder.send(document.getElementById("location-textbox").value);
        populateMoonStats();
    });

    //return time in 12-hour format along with AM/PM as a string
    let timeToString = (time) => {
        return "" + time.getHours() % 12 + ":" + time.getMinutes() + " " + (time.getHours() > 12 ? "PM" : "AM");
    };

    //get the astrological sign corresponding to the given angle
    let getAstroSign = (angle) => {
        //each zodiac sign "rules" a 30 degree sector (360/12)
        //I couldn't actually find a table or calculations for this
        //so I'm assuming that it starts with Aries: 0-29, and so on
        if(angle < 29)
            return "Aries";
        else if (angle < 59)
            return "Taurus";
        else if (angle < 89)
            return "Gemini";
        else if (angle < 119)
            return "Cancer";
        else if (angle < 149)
            return "Leo";
        else if (angle < 179)
            return "Virgo";
        else if (angle < 209)
            return "Libra";
        else if (angle < 239)
            return "Scorpio";
        else if (angle < 269)
            return "Sagittarius";
        else if (angle < 299)
            return "Capricorn";
        else if (angle < 329)
            return "Aquarius";
        else 
            return Pisces;
    }

    //get the name of the phase
    let getPhaseName = (phase) => {
        if (phase === 0)
            return "New Moon";
        else if (phase < .25)
            return "Waxing Crescent";
        else if (phase === .25)
            return "First Quarter";
        else if (phase < .5)
            return "Waxing Gibbous";
        else if (phase === .5)
            return "Full Moon";
        else if (phase < .75)
            return "Waning Gibbous";
        else if (phase === .75)
            return "Last Quarter";
        else
            return "Waning Crescent";
    }

    // populates the moonrise, moonset, etc. containers
    let populateMoonStats = function () {
        let times = SunCalc.getMoonTimes(new Date(), window.localStorage.latitude, window.localStorage.longitude);
        document.querySelector("#box-moonrise span:nth-child(2)").innerHTML = timeToString(times.rise);
        document.querySelector("#box-moonset span:nth-child(2)").innerHTML = timeToString(times.set);

        let illumination = SunCalc.getMoonIllumination(new Date());
        document.querySelector("#box-phase span:first-child").innerHTML = getPhaseName(illumination.phase);
        document.querySelector("#box-phase span:nth-child(2)").innerHTML = Math.round(illumination.fraction * 100) + "%";
        document.querySelector("#box-zodiac span:nth-child(2)").innerHTML = getAstroSign(illumination.angle) + ", " + Math.round(illumination.angle * 100) + "&#176;";
        document.querySelector("#box-zodiac img").src = "svg/" + getAstroSign(illumination.angle) + ".svg#svgView(viewBox(-4,-4,24,24))";
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
