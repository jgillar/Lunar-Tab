window.addEventListener("load", function () {
    /* submit button event listener for the location search box */
    document.getElementById("location-form").addEventListener("submit", function (event) {
        let date = new Date();
        date.setDate(date.getDate() + 5);
        console.log("clicky")
        console.dir(date);
        event.preventDefault();
        geocoder.send(document.getElementById("location-textbox").value);
        populateMoonStats(date);
    });

    //return time in 12-hour format along with AM/PM as a string
    let timeToString = (time) => {
        return "" + time.getHours() % 12 + ":" + time.getMinutes() + " " + (time.getHours() > 12 ? "PM" : "AM");
    };


    //get the astrological sign
    let getAstroSign = (date) => {
        //the moon's 'sign' is dependent on its ecliptic longitude
        //I couldn't find any algorithims or formulas that weren't part of
        //a graduate level astronomy course lecture so I'm using some random library
        //the library incorrectly calculates the constellation so it's done here
        let elongitude = MoonCalc.datasForDay(date).ecliptic.longitude;
        if(elongitude < 29)
            return "Aries";
        else if (elongitude < 59)
            return "Taurus";
        else if (elongitude < 89)
            return "Gemini";
        else if (elongitude < 119)
            return "Cancer";
        else if (elongitude < 149)
            return "Leo";
        else if (elongitude < 179)
            return "Virgo";
        else if (elongitude < 209)
            return "Libra";
        else if (elongitude < 239)
            return "Scorpio";
        else if (elongitude < 269)
            return "Sagittarius";
        else if (elongitude < 299)
            return "Capricorn";
        else if (elongitude < 329)
            return "Aquarius";
        else 
            return "Pisces";
    }

/* 
    var x = 0;
    while(x < 10){
        var date = new Date();
    
        date.setDate( date.getDate() + x);
    
        let data = MoonCalc.datasForDay(date);
        console.log(date);
        console.log(data.ecliptic.longitude);
        console.log(getAstroSign(date));
    
    x++;
    }
     */
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
    let populateMoonStats = (date) => {
        let times,
        illumination,
        astroSign;

        times = SunCalc.getMoonTimes(date, window.localStorage.latitude, window.localStorage.longitude);
        document.querySelector("#box-moonrise span:nth-child(2)").innerHTML = timeToString(times.rise);
        document.querySelector("#box-moonset span:nth-child(2)").innerHTML = timeToString(times.set);

        illumination = SunCalc.getMoonIllumination(date);
        document.querySelector("#box-phase span:first-child").innerHTML = getPhaseName(illumination.phase);
        document.querySelector("#box-phase span:nth-child(2)").innerHTML = Math.round(illumination.fraction * 100) + "%";
        
        astroSign = getAstroSign(date);
        document.querySelector("#box-zodiac span:nth-child(2)").innerHTML = astroSign + ", " + Math.round(0) + "&#176;";
        document.querySelector("#box-zodiac img").src = "svg/" + astroSign + ".svg#svgView(viewBox(-4,-4,24,24))";
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

    populateMoonStats(new Date());



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
