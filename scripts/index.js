window.addEventListener("load", function () {
    /* submit button event listener for the location search box */
    document.getElementById("location-form").addEventListener("submit", function (event) {
        let date = new Date();
        geocoder.send(document.getElementById("location-textbox").value);
        populateMoonStats(date);
        event.preventDefault();
    });

    //return time in 12-hour format along with AM/PM as a string
    let timeToString = (time) => {
        return "" + time.getHours() % 12 + ":" + time.getMinutes() + " " + (time.getHours() > 12 ? "PM" : "AM");
    };

    //get the current planetary hour
    //returns an object containing the name of the 'ruler' of the hour and interval
    let getPlanetaryHour = (date) => {
        date.setSeconds(0);
        let sun = SunCalc.getTimes(date, window.localStorage.latitude, window.localStorage.longitude),
            moon = SunCalc.getMoonTimes(date, window.localStorage.latitude, window.localStorage.longitude),
            sunriseTime = new Date(sun.sunrise.setSeconds(0)).getTime(),
            sunsetTime = new Date(sun.sunset.setSeconds(0)).getTime(),
            chaldeanSequence = [6, 4, 2, 0, 5, 3, 1], //Saturn, Jupiter, etc. 
            weekSequence = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"],
            dayOfTheWeek = date.getDay(),
            currentTime = date.getTime(),
            dayLength,
            nightLength,
            dayOfTheWeekIndex,
            chaldeanChunk,
            hourNumber,
            planetaryHour = {};

        console.log("sunrise sunset");
        console.log(sunriseTime, sunsetTime);
        //NEED TO FIX
        //DOESN'T WORK CORRECTLY WHEN DATE IS NEXT DAY BUT BEFORE SUNRISE
        //3:00 AM TUESDAY IS STILL LUNAR MONDAY
        //NEED TO HANDLE THIS


        //the Chaldean Sequence repeats every day starting with the day's 'ruling planet'
        //shift the chaldean sequence array to start with the day's 'ruler'
        dayOfTheWeekIndex = chaldeanSequence.indexOf(dayOfTheWeek);
        chaldeanChunk = chaldeanSequence.splice(0, dayOfTheWeekIndex);
        chaldeanSequence.push(...chaldeanChunk);

        //there are 12 'planetary hours' during the day and 12 at night
        let date2 = new Date();
        date2.setDate(date.getDate() + 1);
        let tomorrow = SunCalc.getTimes(date2, window.localStorage.latitude, window.localStorage.longitude);
        dayLength = Math.round(Math.abs(sunsetTime - sunriseTime));
        nightLength = Math.round(Math.abs(sunsetTime - tomorrow.sunrise.getTime()));

        //the length of an day hour + the length of a night hour ALWAYS sum to 120 minutes
        let dayHourLength = Math.round(dayLength / 12);
        let nightHourLength = (Math.abs(120 * 60 * 1000 - dayHourLength));

        //there are 12 equal length hours
        //to find which one the current hour sits in we just need to divide by
        //the length of the hour length 
        if (currentTime < sunsetTime) {
            hourNumber = Math.floor((currentTime - sunriseTime) / dayHourLength);
            planetaryHour.hourStart = new Date(sunriseTime + hourNumber * dayHourLength);
            planetaryHour.hourEnd = new Date(planetaryHour.hourStart.getTime() + dayHourLength);
        }
        else {
            hourNumber = Math.floor((currentTime - sunsetTime) / nightHourLength);
            planetaryHour.hourStart = new Date(sunsetTime + hourNumber * nightHourLength);
            planetaryHour.hourEnd = new Date(planetaryHour.hourStart + nightHourLength);
        }
        planetaryHour.hour = hourNumber;
        planetaryHour.name = weekSequence[chaldeanSequence[hourNumber % 7]];

        for (let x = 0; x < 24; x++) {
            if (x === 12)
                console.log("\n");
            if (x < 12)
                console.log(x, weekSequence[chaldeanSequence[x % 7]], new Date(sunriseTime + x * dayHourLength));
            else
                console.log(x, weekSequence[chaldeanSequence[x % 7]], new Date(sunsetTime + x % 12 * nightHourLength));
        }

        return planetaryHour;
    }

    //get the astrological sign
    let getAstroSign = (date) => {
        //the moon's 'sign' is dependent on its ecliptic longitude
        //I couldn't find any algorithims or formulas that weren't part of
        //a graduate level astronomy course lecture so I'm using a library
        //the library incorrectly calculates the constellation so it's done here
        let elongitude = MoonCalc.datasForDay(date).ecliptic.longitude;
        if (elongitude < 29)
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
            astroSign,
            planetaryHour;

        times = SunCalc.getMoonTimes(date, window.localStorage.latitude, window.localStorage.longitude);
        document.querySelector("#box-moonrise span:nth-child(2)").innerHTML = timeToString(times.rise);
        document.querySelector("#box-moonset span:nth-child(2)").innerHTML = timeToString(times.set);

        illumination = SunCalc.getMoonIllumination(date);
        document.querySelector("#box-phase span:first-child").innerHTML = getPhaseName(illumination.phase);
        document.querySelector("#box-phase span:nth-child(2)").innerHTML = Math.round(illumination.fraction * 100) + "% illuminated";

        astroSign = getAstroSign(date);
        document.querySelector("#box-zodiac span:nth-child(2)").innerHTML = astroSign;
        document.querySelector("#box-zodiac img").src = "svg/" + astroSign + ".svg#svgView(viewBox(-4,-4,24,24))";
        document.querySelector("#box-zodiac img").title =  astroSign;

        planetaryHour = getPlanetaryHour(date);
        document.querySelector("#box-hour span:nth-child(2)").innerHTML = 
            planetaryHour.name + ", " 
            + planetaryHour.hourStart.getHours() + ":" + planetaryHour.hourStart.getMinutes() + " - " 
            + planetaryHour.hourEnd.getHours() + ":" + planetaryHour.hourEnd.getMinutes();
        document.querySelector("#box-hour img").src = "svg/" + planetaryHour.name + ".svg#svgView(viewBox(-4,-4,24,24))";
        document.querySelector("#box-hour img").title =  planetaryHour.name;

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
                    let responseObj = JSON.parse(event.target.responseText),
                        localStorage = window.localStorage;
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
