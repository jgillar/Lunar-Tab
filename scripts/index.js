window.addEventListener("load", function () {
        // ...and take over its submit event.
        document.getElementById("location-form").addEventListener("submit", function (event) {
          event.preventDefault();
          console.log('clicked');
          console.dir(this);
          geocoder.send("new york");
        });

    //just a simple object for handling API calls
    let geocoder = {
        url: "https://maps.googleapis.com/maps/api/geocode/json?",
        key: CONFIG.key,
        buildQuery: function(value){
            return this.url + encodeURI("address=" + value + "&key=" + CONFIG.key);
        },
        send: function(value) {
            let request = new XMLHttpRequest();
  
            // Bind the FormData object and the form element
            //var FD = new FormData(form);
  
            // Define what happens on successful data submission
            request.addEventListener("load", function(event) {
                console.log(event.target.responseText);
            });
  
            // Define what happens in case of error
            request.addEventListener("error", function(event) {
                alert('Oops! Something went wrong.');
            });
        
            request.open("GET", this.buildQuery(value));
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            request.send();
        }
    };

    geocoder.send("salisbury");


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
