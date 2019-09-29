/*  Lunar Tab - a new tab extension for Google Chrome
    shows moonrise, moonset and some astrological info if you're into that sort of thing 
*/

//get the current planetary hour
//returns an object containing the name of the 'ruler' of the hour and interval
let getPlanetaryHour = (date, location) => {
	let sun = SunCalc.getTimes(date, location.latitude, location.longitude),
		sunriseTime = new Date(sun.sunrise.setSeconds(0)).getTime(),
		sunsetTime = new Date(sun.sunset.setSeconds(0)).getTime(),
		chaldeanSequence = [6, 4, 2, 0, 5, 3, 1], //Saturn, Jupiter, etc.
		weekSequence = [
			"Sun",
			"Moon",
			"Mars",
			"Mercury",
			"Jupiter",
			"Venus",
			"Saturn"
		],
		dayOfTheWeek = date.getDay(),
		currentTime = date.getTime(),
		dayLength,
		dayOfTheWeekIndex,
		chaldeanChunk,
		hourNumber,
		planetaryHour = {};

	//the date is passed in but it needs to be manipulated for calculations
	//not a good idea to alter it so just make a new object instead
	//(JS is pass by reference and assign by value for objects)
	date = new Date(date.getTime());
	date.setSeconds(0);

	//planetary 'days' don't start and end at midnight, they start/end at sunrise
	//so if it's before sunrise, it's still considered "yesterday" night
	if (currentTime < sunriseTime) {
		date.setDate(date.getDate() - 1);
		date.setSeconds(0);
		sun = SunCalc.getTimes(date, location.latitude, location.longitude);
		sunriseTime = new Date(sun.sunrise.setSeconds(0)).getTime();
		sunsetTime = new Date(sun.sunset.setSeconds(0)).getTime();
		dayOfTheWeek = date.getDay();
	}

	//the Chaldean Sequence repeats every day starting with the day's 'ruling planet'
	//shift the chaldean sequence array to start with the day's 'ruler'
	dayOfTheWeekIndex = chaldeanSequence.indexOf(dayOfTheWeek);
	chaldeanChunk = chaldeanSequence.splice(0, dayOfTheWeekIndex);
	chaldeanSequence.push(...chaldeanChunk);

	//there are 12 'planetary hours' during the day and 12 at night
	let tomorrow = new Date();
	tomorrow.setDate(date.getDate() + 1);
	let tomorrowSunrise = SunCalc.getTimes(
		tomorrow,
		location.latitude,
		location.longitude
	);
	dayLength = Math.round(Math.abs(sunsetTime - sunriseTime));
	nightLength = Math.round(
		Math.abs(sunsetTime - tomorrowSunrise.sunrise.getTime())
	);

	//the length of an day hour + the length of a night hour ALWAYS sum to 120 minutes
	let dayHourLength = Math.round(dayLength / 12);
	let nightHourLength = Math.abs(120 * 60 * 1000 - dayHourLength);

	//there are 12 equal length hours
	//to find which one the current hour sits in we just need to divide by
	//the length of the hour length
	if (currentTime < sunsetTime) {
		hourNumber = Math.floor((currentTime - sunriseTime) / dayHourLength);
		planetaryHour.hourStart = new Date(
			sunriseTime + hourNumber * dayHourLength
		);
		planetaryHour.hourEnd = new Date(
			planetaryHour.hourStart.getTime() + dayHourLength
		);
	} else {
		hourNumber = Math.floor((currentTime - sunsetTime) / nightHourLength);
		planetaryHour.hourStart = new Date(
			sunsetTime + hourNumber * nightHourLength
		);
		planetaryHour.hourEnd = new Date(
			planetaryHour.hourStart.getTime() + nightHourLength
		);
		//remember we still had 12 daylight hours before night so this is the x+12th hour
		hourNumber = hourNumber + 12;
	}

	planetaryHour.hour = hourNumber;
	planetaryHour.name = weekSequence[chaldeanSequence[hourNumber % 7]];

	return planetaryHour;
};

//get the astrological sign
let getAstroSign = date => {
	//the moon's 'sign' is dependent on its ecliptic longitude
	//I couldn't find any algorithims or formulas that weren't part of
	//a graduate level astronomy course lecture so I'm using a library
	//the library incorrectly calculates the constellation so it's done here
	let elongitude = MoonCalc.datasForDay(date).ecliptic.longitude;
	if (elongitude < 29) return "Aries";
	else if (elongitude < 59) return "Taurus";
	else if (elongitude < 89) return "Gemini";
	else if (elongitude < 119) return "Cancer";
	else if (elongitude < 149) return "Leo";
	else if (elongitude < 179) return "Virgo";
	else if (elongitude < 209) return "Libra";
	else if (elongitude < 239) return "Scorpio";
	else if (elongitude < 269) return "Sagittarius";
	else if (elongitude < 299) return "Capricorn";
	else if (elongitude < 329) return "Aquarius";
	else return "Pisces";
};

//get the name of the phase
let getPhaseName = phase => {
	//only one full/new/"named" day per lunar cycle (29.5 days)
	//so the "threshold" for being a "named day" is +-29.5/2%
	const t = 29.5 / 2 / 1000;
	if (phase < t * 2) return "New Moon";
	else if (phase < 0.25 - t) return "Waxing Crescent";
	else if (phase < 0.25 + t) return "First Quarter";
	else if (phase < 0.5 - t) return "Waxing Gibbous";
	else if (phase < 0.5 + t) return "Full Moon";
	else if (phase < 0.75 - t) return "Waning Gibbous";
	else if (phase < 0.75 + t) return "Last Quarter";
	else return "Waning Crescent";
};

//return time in 12-hour format along with AM/PM as a string
let timeToString = function(time) {
	let hours = time.getHours(),
		minutes = time.getMinutes();
	return (
		"" +
		(hours % 12 === 0 ? "12" : hours % 12) +
		":" +
		(minutes < 10 ? "0" + minutes : minutes) +
		" " +
		(hours >= 12 ? "PM" : "AM")
	);
};

// populates the moonrise, moonset, etc. containers
let populateMoonStats = (date, location) => {
	let times, illumination, astroSign, planetaryHour, moonContainer;

	times = SunCalc.getMoonTimes(date, location.latitude, location.longitude);

	//sometimes SunCalc will return an object with no rise property or no set property
	//it seems random, sometimes it will happen to the same location
	//ex salisbury 21804 dec 4
	if (times.rise)
		document.querySelector(
			"#box-moonrise span:nth-child(2)"
		).innerHTML = timeToString(times.rise);
	if (times.set)
		document.querySelector(
			"#box-moonset span:nth-child(2)"
		).innerHTML = timeToString(times.set);

	console.log(date);
	illumination = SunCalc.getMoonIllumination(date);
	document.querySelector(
		"#box-phase span:first-child"
	).innerHTML = getPhaseName(illumination.phase);
	document.querySelector("#box-phase span:nth-child(2)").innerHTML =
		Math.round(+illumination.fraction.toFixed(2) * 100) + "% illuminated";
	astroSign = getAstroSign(date);
	document.querySelector(
		"#box-zodiac span:nth-child(2)"
	).innerHTML = astroSign;
	document.querySelector("#box-zodiac img").src =
		"svg/" + astroSign + ".svg#svgView(viewBox(-4,-4,24,24))";
	document.querySelector("#box-zodiac img").title = astroSign;

	planetaryHour = getPlanetaryHour(date, location);

	document.querySelector("#box-hour span:nth-child(2)").innerHTML =
		planetaryHour.name +
		", " +
		timeToString(planetaryHour.hourStart) +
		" - " +
		timeToString(planetaryHour.hourEnd);
	document.querySelector("#box-hour img").src =
		"svg/" + planetaryHour.name + ".svg#svgView(viewBox(-4,-4,24,24))";
	document.querySelector("#box-hour img").title = planetaryHour.name;

	drawPlanetPhase(
		document.getElementById("moon"),
		illumination.fraction,
		false,
		{
			diameter: 500,
			earthshine: 0,
			shadowColour: "#1e132c",
			lightColour: "#c2b9d8",
			blur: 2
		}
	);

	moonContainer = document.getElementById("moon-container");
	moonContainer.className = moonContainer.className.replace(
		/moon-error/g,
		""
	);
};

//only run when there's an error
//remove all info about the moon on the page
let clearMoonStats = () => {
	document.getElementById("moon-container").className += " moon-error";
	document.getElementById("moon").innerHTML = "";
	document.getElementById("moon-text").innerHTML =
		"Location couldn't be found. Please try again.";
	document.querySelector("#box-phase span:first-child").innerHTML =
		"Moon Phase";
	document
		.querySelectorAll(".box span:nth-child(2)")
		.forEach((element, index) => {
			element.innerHTML = "...";
		});
};

//just a simple object for handling API calls
let geocoder = {
	url: "https://maps.googleapis.com/maps/api/geocode/json?",
	key: CONFIG.key,
	buildQuery: function(value) {
		return this.url + encodeURI("address=" + value + "&key=" + CONFIG.key);
	},
	send: function(value, callback) {
		let request = new XMLHttpRequest();
		//successful request
		request.addEventListener("load", event => {
			callback(event);
		});

		request.open("POST", this.buildQuery(value));
		request.setRequestHeader(
			"Content-type",
			"application/x-www-form-urlencoded"
		);
		request.send();
	}
};

window.addEventListener("load", function() {
	//submit button event listener for the location search box
	let locationTextbox = document.getElementById("location-textbox");
	document
		.getElementById("location-form")
		.addEventListener("submit", function(event) {
			event.preventDefault();
			geocoder.send(locationTextbox.value, function(event) {
				let responseObj = JSON.parse(event.target.responseText),
					localStorage = window.localStorage,
					locationDiv = document.getElementById("location-data");

				if (responseObj.status === "ZERO_RESULTS") {
					locationDiv.className += " location-error";
					clearMoonStats();
					return;
				} else {
					locationDiv.className = locationTextbox.className.replace(
						/location-error/g,
						""
					);
				}
				//store the long/lat coords and location name for quick access
				localStorage.setItem(
					"longitude",
					responseObj.results[0].geometry.location.lng
				);
				localStorage.setItem(
					"latitude",
					responseObj.results[0].geometry.location.lat
				);
				localStorage.setItem(
					"address",
					responseObj.results[0].formatted_address
				);
			});
		});

	//if the user entered their address already at some point then show moon info
	//otherwise just show New York as a deafult
	if (window.localStorage.address != null) {
		let date = new Date();
		document.getElementById("location-textbox").value =
			window.localStorage.address;
		populateMoonStats(date, window.localStorage);
	} else {
		document.getElementById("location-textbox").value = "Manhattan, NY";
		geocoder.send("Manhattan, NY", function(event) {
			let responseObj = JSON.parse(event.target.responseText),
				location = {};
			location.address = responseObj.results[0].formatted_address;
			location.longitude = responseObj.results[0].geometry.location.lng;
			location.latitude = responseObj.results[0].geometry.location.lat;
			populateMoonStats(new Date(), location);
		});
	}
});
