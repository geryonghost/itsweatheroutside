// Get the weather forecast from the searchquery
async function getWeather(query) {
    query = query.replace(/\s+/g, ' ') //Replace multiple spaces with a single space
    query = query.trim();
    query = query.toLowerCase();
    query = query.replace('.','').replace(',','');
    query = query.replace('lane','ln');

    let lat, lon, addresstype, addressname
    let forecasturl, weather_forecast_api, weather_alerts_api, location
    let forecastdaily_results, forecasthourly_results, forecastgriddata_results, forecastalerts_results 

    // Get the latitude and longitude from Nominatim
    if (query != "") {
        console.log("Getting latitude and longitude")
        try {
            const mapdata_querystring = "q=" + query + "&format=jsonv2&accept-language=en&countrycodes=us&limit=1&email=skyyweatherapp@comtily.com"
            const mapdata_results = await fetch("https://nominatim.openstreetmap.org/search?" + mapdata_querystring, {
                method: "get",
                mode: "cors",
            })
            if (mapdata_results.status == 200) {
                mapdata = await mapdata_results.json()
                
                lat = mapdata[0].lat
                lon = mapdata[0].lon
                addresstype = mapdata[0].addresstype
                addressname = mapdata[0].name
                
                console.log(lat + ',' + lon)
                console.log(addresstype + ', ' + addressname)
            }

        } catch (error) {
            console.log("Unable to reach the service. Quer:" + query)
            console.error(error)
        }
    } else {
        console.error("No query was submitted")
    }

    if (lat != "" && lon != "") {
        // Get weather api urls
        weather_forecast_api = 'https://api.weather.gov/points/'
        weather_alerts_api = 'https://api.weather.gov/alerts/active/?point='  
        location = lat + ',' + lon;

        console.log("Getting Forecast URL");
        try {
            const results = await fetch(weather_forecast_api + location)
            if (results.status == 200) {
                results_json = await results.json()
                if (results_json.properties.forecastGridData != null) {
                    forecasturl = results_json.properties.forecastGridData
                    // console.log(forecasturl)
                } else {
                    console.log("Error missing forecast URL")
                }
            }
        } catch (err) {
            console.error('Error fetching forecast URL', err)
        }
    } else {
        console.error("Latitude and/or Longitude were not acquired")
    }

    if (forecasturl != "" && forecasturl != undefined) {
        // Get the weather forecasts
        try {
            console.log("Requesting Daily Forecast")
            forecastdaily_results = await fetch(forecasturl + '/forecast')
        
            console.log("Requesting Hourly Forecast")
            forecasthourly_results = await fetch(forecasturl + '/forecast/hourly')
        
            console.log("Requesting Grid Raw Forecast")
            forecastgriddata_results = await fetch(forecasturl)
        
            console.log("Requesting Alerts")
            forecastalerts_results = await fetch(weather_alerts_api + location)
        } catch (error) {
            console.error('Error fetching weather data:', error)
        }
    }

    if (forecastdaily_results != undefined && forecasthourly_results != undefined && forecastalerts_results != undefined && forecastgriddata_results != undefined) {
        forecastdaily = await forecastdaily_results.json()
        forecastdaily = forecastdaily.properties.periods
        // console.log(forecastdaily)

        forecasthourly = await forecasthourly_results.json()
        forecasthourly = forecasthourly.properties.periods
        // console.log(forecasthourly)
        
        forecastalerts = await forecastalerts_results.json()
        forecastalerts = forecastalerts.features
        // console.log(forecastalerts)

        forecastgriddata = await forecastgriddata_results.json()
        forecastgriddata = forecastgriddata.properties
        // console.log(forecastgriddata)
    }
    
    // Get Current Forecast
    currentForecast(addressname, forecasthourly)

    //Call additional functions to format and display the content in the HTML

}

function currentForecast(addressname, forecasthourly) {
    // const timezone = forecast[0].forecastdaily[0].startTime.substring(forecast[0].forecastdaily[0].startTime.length - 6)
    let temperaturesum = temperatureaverage = 0
    let temperaturetrend
    const currentforecast = document.getElementById("currentforecast")

    currentforecast.innerHTML = "<div style=\"text-align: center; border-style: dotted;\">"
    currentforecast.innerHTML = currentforecast.innerHTML + "<h2>" + addressname + "</h2>"
    currentforecast.innerHTML = currentforecast.innerHTML + "" + forecasthourly[0].temperature + "&#176; " + forecasthourly[0].temperatureUnit

    for (let i = 0; i < 10; i++) {
        temperaturesum += forecasthourly[0].temperature
    }
    temperatureaverage = temperaturesum / 10
    
    if (forecasthourly[0].temperature > temperatureaverage) { 
        currentforecast.innerHTML = currentforecast.innerHTML + " <span style=\"color:red;\">&#8595;</span>"
    }
    else if (forecasthourly[0].temperature < temperatureaverage) { 
        currentforecast.innerHTML = currentforecast.innerHTML +  " <span style=\"color:green\";>&#8593;</span>"
    }

    currentforecast.innerHTML = currentforecast.innerHTML + "<h4>" + forecasthourly[0].shortForecast + "</h4>"
    // currentforecast.innerHTML = currentforecast.innerHTML + "<h5>Timezone (" + timezone + ")</h5>"
    // currentforecast.innerHTML = currentforecast.innerHTML + "<h5>Elevation (" + Math.round(griddata.elevation.value) + formatUnitCode(griddata.elevation.unitCode) + ")</h5>"
    currentforecast.innerHTML = currentforecast.innerHTML + "</div>"
}

// getWeather("60601")
// getWeather("Bristol Bay")

// Get the query string
var queryString = window.location.search;

// Create a URLSearchParams object
var searchParams = new URLSearchParams(queryString);

// Get individual parameters
const query = searchParams.get('q');
if (query != "" && query != undefined) {
    getWeather(query)
}